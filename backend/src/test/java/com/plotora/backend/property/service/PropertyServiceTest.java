package com.plotora.backend.property.service;

import com.plotora.backend.property.Furnishing;
import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.ListingType;
import com.plotora.backend.property.Property;
import com.plotora.backend.property.PropertyCategory;
import com.plotora.backend.property.dto.PropertyRequest;
import com.plotora.backend.property.dto.PropertyResponse;
import com.plotora.backend.property.exception.InvalidPropertyException;
import com.plotora.backend.property.exception.InvalidStatusTransitionException;
import com.plotora.backend.property.exception.PropertyNotFoundException;
import com.plotora.backend.property.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PropertyServiceTest {

    private static final UUID OWNER = UUID.randomUUID();
    private static final UUID OTHER = UUID.randomUUID();

    @Mock
    private PropertyRepository repository;

    @InjectMocks
    private PropertyService service;

    @BeforeEach
    void setUp() {
        lenient().when(repository.save(any(Property.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(repository.existsByReferenceCode(anyString())).thenReturn(false);
    }

    // ---------- request builders ----------

    static PropertyRequest land() {
        return new PropertyRequest(
                "20 perch land in Habaraduwa", "Near the beach", PropertyCategory.LAND, ListingType.SALE,
                new BigDecimal("27000000"), "Main Road, Habaraduwa", "Galle", 6.0, 80.3,
                new BigDecimal("20"), "Freehold", new BigDecimal("24"), "North",
                null, null, null, null,
                null, null, null,
                List.of("Water", "Electricity"), List.of("https://img/1.jpg", "https://img/2.jpg"));
    }

    static PropertyRequest house(Integer bedrooms, Integer bathrooms, BigDecimal floorArea) {
        return new PropertyRequest(
                "3-bedroom house in Kundasale", null, PropertyCategory.HOUSE, ListingType.SALE,
                new BigDecimal("45000000"), "Temple Road", "Kandy", 7.3, 80.7,
                new BigDecimal("10"), null, null, null,
                bedrooms, bathrooms, floorArea, 2,
                null, null, null, null, null);
    }

    static PropertyRequest rentHouse() {
        return new PropertyRequest(
                "3-bedroom house for rent", null, PropertyCategory.HOUSE, ListingType.RENT,
                new BigDecimal("185000"), "Temple Road", "Kandy", 7.3, 80.7,
                null, null, null, null,
                3, 2, new BigDecimal("1800"), 1,
                new BigDecimal("555000"), LocalDate.of(2026, 12, 1), Furnishing.SEMI_FURNISHED,
                null, null);
    }

    static Property existing(ListingStatus status) {
        Property p = new Property();
        p.setId(UUID.randomUUID());
        p.setOwnerId(OWNER);
        p.setStatus(status);
        p.setReferenceCode("PLT-2026-AAAAAA");
        p.setTitle("Existing listing");
        p.setCategory(PropertyCategory.LAND);
        p.setListingType(ListingType.SALE);
        p.setPrice(new BigDecimal("1000000"));
        return p;
    }

    // ---------- create ----------

    @Nested
    class Create {

        @Test
        void createsLandListingAsDraftWithReferenceCodeAndPricePerPerch() {
            PropertyResponse r = service.create(land(), OWNER);

            assertThat(r.status()).isEqualTo(ListingStatus.DRAFT);
            assertThat(r.ownerId()).isEqualTo(OWNER);
            assertThat(r.referenceCode()).matches("PLT-\\d{4}-[A-Z0-9]{6}");
            assertThat(r.pricePerPerch()).isEqualByComparingTo("1350000.00");
            assertThat(r.imageUrls()).containsExactly("https://img/1.jpg", "https://img/2.jpg");
            assertThat(r.features()).containsExactly("Water", "Electricity");
            assertThat(r.monthlyRent()).isNull();
        }

        @Test
        void rentListingCopiesPriceToMonthlyRentAndHasNoPricePerPerch() {
            PropertyResponse r = service.create(rentHouse(), OWNER);

            assertThat(r.monthlyRent()).isEqualByComparingTo("185000");
            assertThat(r.depositAmount()).isEqualByComparingTo("555000");
            assertThat(r.pricePerPerch()).isNull();
        }

        @Test
        void regeneratesReferenceCodeOnCollision() {
            when(repository.existsByReferenceCode(anyString())).thenReturn(true, false);

            PropertyResponse r = service.create(land(), OWNER);

            assertThat(r.referenceCode()).startsWith("PLT-");
            verify(repository, org.mockito.Mockito.times(2)).existsByReferenceCode(anyString());
        }
    }

    // ---------- category rules ----------

    @Nested
    class CategoryRules {

        @Test
        void landWithBedroomsIsRejected() {
            PropertyRequest r = new PropertyRequest(
                    "20 perch land in Habaraduwa", null, PropertyCategory.LAND, ListingType.SALE,
                    new BigDecimal("100"), "addr", "Galle", 6.0, 80.3,
                    new BigDecimal("20"), null, null, null,
                    3, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> service.create(r, OWNER))
                    .isInstanceOf(InvalidPropertyException.class)
                    .hasMessageContaining("bedrooms");
            verify(repository, never()).save(any());
        }

        @Test
        void landWithoutExtentIsRejected() {
            PropertyRequest r = new PropertyRequest(
                    "20 perch land in Habaraduwa", null, PropertyCategory.LAND, ListingType.SALE,
                    new BigDecimal("100"), "addr", "Galle", 6.0, 80.3,
                    null, null, null, null, null, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> service.create(r, OWNER))
                    .isInstanceOf(InvalidPropertyException.class)
                    .hasMessageContaining("extent");
        }

        @Test
        void landWithFloorAreaIsRejected() {
            PropertyRequest r = new PropertyRequest(
                    "20 perch land in Habaraduwa", null, PropertyCategory.LAND, ListingType.SALE,
                    new BigDecimal("100"), "addr", "Galle", 6.0, 80.3,
                    new BigDecimal("20"), null, null, null,
                    null, null, new BigDecimal("1000"), null, null, null, null, null, null);

            assertThatThrownBy(() -> service.create(r, OWNER)).isInstanceOf(InvalidPropertyException.class);
        }

        @Test
        void houseWithoutBedroomsIsRejected() {
            assertThatThrownBy(() -> service.create(house(null, 2, new BigDecimal("1500")), OWNER))
                    .isInstanceOf(InvalidPropertyException.class)
                    .hasMessageContaining("Bedrooms");
        }

        @Test
        void houseWithoutFloorAreaIsRejected() {
            assertThatThrownBy(() -> service.create(house(3, 2, null), OWNER))
                    .isInstanceOf(InvalidPropertyException.class)
                    .hasMessageContaining("Floor area");
        }

        @Test
        void validHouseIsAccepted() {
            PropertyResponse r = service.create(house(3, 2, new BigDecimal("1500")), OWNER);
            assertThat(r.bedrooms()).isEqualTo(3);
        }

        @Test
        void commercialWithoutAnyAreaIsRejected() {
            PropertyRequest r = new PropertyRequest(
                    "Shop space in Colombo 03", null, PropertyCategory.COMMERCIAL, ListingType.SALE,
                    new BigDecimal("100"), "addr", "Colombo", 6.9, 79.85,
                    null, null, null, null, null, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> service.create(r, OWNER)).isInstanceOf(InvalidPropertyException.class);
        }

        @Test
        void saleWithDepositIsRejected() {
            PropertyRequest r = new PropertyRequest(
                    "20 perch land in Habaraduwa", null, PropertyCategory.LAND, ListingType.SALE,
                    new BigDecimal("100"), "addr", "Galle", 6.0, 80.3,
                    new BigDecimal("20"), null, null, null, null, null, null, null,
                    new BigDecimal("1000"), null, null, null, null);

            assertThatThrownBy(() -> service.create(r, OWNER))
                    .isInstanceOf(InvalidPropertyException.class)
                    .hasMessageContaining("rental");
        }
    }

    // ---------- read ----------

    @Test
    void getMyListingsWithoutStatusReturnsAll() {
        when(repository.findByOwnerIdOrderByCreatedAtDesc(OWNER))
                .thenReturn(List.of(existing(ListingStatus.DRAFT), existing(ListingStatus.PUBLISHED)));

        assertThat(service.getMyListings(OWNER, null)).hasSize(2);
    }

    @Test
    void getMyListingsFiltersByStatus() {
        when(repository.findByOwnerIdAndStatusOrderByCreatedAtDesc(OWNER, ListingStatus.DRAFT))
                .thenReturn(List.of(existing(ListingStatus.DRAFT)));

        assertThat(service.getMyListings(OWNER, ListingStatus.DRAFT))
                .singleElement()
                .extracting(PropertyResponse::status)
                .isEqualTo(ListingStatus.DRAFT);
    }

    @Test
    void anotherSellersListingIsReportedAsNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndOwnerId(id, OTHER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getMyProperty(id, OTHER))
                .isInstanceOf(PropertyNotFoundException.class);
    }

    @Test
    void getMyPropertyReturnsOwnedListing() {
        Property p = existing(ListingStatus.DRAFT);
        when(repository.findByIdAndOwnerId(p.getId(), OWNER)).thenReturn(Optional.of(p));

        assertThat(service.getMyProperty(p.getId(), OWNER).id()).isEqualTo(p.getId());
    }

    // ---------- update / submit / delete ----------

    @Test
    void editingRejectedListingMovesItBackToDraft() {
        Property p = existing(ListingStatus.REJECTED);
        when(repository.findByIdAndOwnerId(p.getId(), OWNER)).thenReturn(Optional.of(p));

        PropertyResponse r = service.update(p.getId(), land(), OWNER);

        assertThat(r.status()).isEqualTo(ListingStatus.DRAFT);
        assertThat(r.title()).isEqualTo("20 perch land in Habaraduwa");
    }

    @Test
    void editingPublishedListingIsNotAllowed() {
        Property p = existing(ListingStatus.PUBLISHED);
        when(repository.findByIdAndOwnerId(p.getId(), OWNER)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> service.update(p.getId(), land(), OWNER))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void submittingDraftMovesItToPendingReview() {
        Property p = existing(ListingStatus.DRAFT);
        when(repository.findByIdAndOwnerId(p.getId(), OWNER)).thenReturn(Optional.of(p));

        assertThat(service.submitForReview(p.getId(), OWNER).status()).isEqualTo(ListingStatus.PENDING_REVIEW);
    }

    @Test
    void submittingPendingListingIsNotAllowed() {
        Property p = existing(ListingStatus.PENDING_REVIEW);
        when(repository.findByIdAndOwnerId(p.getId(), OWNER)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> service.submitForReview(p.getId(), OWNER))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void deletingDraftRemovesIt() {
        Property p = existing(ListingStatus.DRAFT);
        when(repository.findByIdAndOwnerId(p.getId(), OWNER)).thenReturn(Optional.of(p));

        service.delete(p.getId(), OWNER);

        verify(repository).delete(p);
    }

    @Test
    void deletingPublishedListingIsNotAllowed() {
        Property p = existing(ListingStatus.PUBLISHED);
        when(repository.findByIdAndOwnerId(p.getId(), OWNER)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> service.delete(p.getId(), OWNER))
                .isInstanceOf(InvalidStatusTransitionException.class);
        verify(repository, never()).delete(any());
    }
}
