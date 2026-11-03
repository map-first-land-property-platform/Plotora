package com.plotora.backend.property.service;

import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.ListingType;
import com.plotora.backend.property.Property;
import com.plotora.backend.property.PropertyCategory;
import com.plotora.backend.property.PropertyImage;
import com.plotora.backend.property.dto.PropertyRequest;
import com.plotora.backend.property.dto.PropertyResponse;
import com.plotora.backend.property.exception.InvalidPropertyException;
import com.plotora.backend.property.exception.InvalidStatusTransitionException;
import com.plotora.backend.property.exception.PropertyNotFoundException;
import com.plotora.backend.property.repository.PropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Year;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Seller-side listing management: create, read, update, submit and delete own listings. */
@Service
@Transactional(readOnly = true)
public class PropertyService {

    private static final Set<ListingStatus> EDITABLE = EnumSet.of(ListingStatus.DRAFT, ListingStatus.REJECTED);
    private static final Set<ListingStatus> DELETABLE =
            EnumSet.of(ListingStatus.DRAFT, ListingStatus.REJECTED, ListingStatus.PENDING_REVIEW);
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final PropertyRepository repository;
    private final SecureRandom random = new SecureRandom();

    public PropertyService(PropertyRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PropertyResponse create(PropertyRequest request, UUID ownerId) {
        validateCategoryRules(request);
        Property property = new Property();
        property.setOwnerId(ownerId);
        property.setStatus(ListingStatus.DRAFT);
        property.setReferenceCode(generateReferenceCode());
        applyRequest(property, request);
        return PropertyResponse.from(repository.save(property));
    }

    public List<PropertyResponse> getMyListings(UUID ownerId, ListingStatus status) {
        List<Property> listings = status == null
                ? repository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                : repository.findByOwnerIdAndStatusOrderByCreatedAtDesc(ownerId, status);
        return listings.stream().map(PropertyResponse::from).toList();
    }

    public PropertyResponse getMyProperty(UUID id, UUID ownerId) {
        return PropertyResponse.from(findOwned(id, ownerId));
    }

    @Transactional
    public PropertyResponse update(UUID id, PropertyRequest request, UUID ownerId) {
        Property property = findOwned(id, ownerId);
        if (!EDITABLE.contains(property.getStatus())) {
            throw new InvalidStatusTransitionException(
                    "Only DRAFT or REJECTED listings can be edited (current: " + property.getStatus() + ")");
        }
        validateCategoryRules(request);
        applyRequest(property, request);
        // A rejected listing that is edited goes back to draft so it can be resubmitted.
        property.setStatus(ListingStatus.DRAFT);
        return PropertyResponse.from(repository.save(property));
    }

    @Transactional
    public PropertyResponse submitForReview(UUID id, UUID ownerId) {
        Property property = findOwned(id, ownerId);
        if (!EDITABLE.contains(property.getStatus())) {
            throw new InvalidStatusTransitionException(
                    "Only DRAFT or REJECTED listings can be submitted (current: " + property.getStatus() + ")");
        }
        property.setStatus(ListingStatus.PENDING_REVIEW);
        return PropertyResponse.from(repository.save(property));
    }

    @Transactional
    public void delete(UUID id, UUID ownerId) {
        Property property = findOwned(id, ownerId);
        if (!DELETABLE.contains(property.getStatus())) {
            throw new InvalidStatusTransitionException(
                    "Published or sold listings cannot be deleted (current: " + property.getStatus() + ")");
        }
        repository.delete(property);
    }

    // ---------- helpers ----------

    private Property findOwned(UUID id, UUID ownerId) {
        return repository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new PropertyNotFoundException(id));
    }

    /** Category- and listing-type-specific rules that annotations cannot express. */
    void validateCategoryRules(PropertyRequest r) {
        PropertyCategory c = r.category();
        if (c == PropertyCategory.LAND) {
            require(r.extentPerches() != null, "Land extent (perches) is required for land listings");
            forbid(r.bedrooms() != null || r.bathrooms() != null,
                    "Land listings cannot have bedrooms or bathrooms");
            forbid(r.floorAreaSqft() != null || r.floors() != null || r.furnishing() != null,
                    "Land listings cannot have floor area, floors or furnishing");
        } else if (c == PropertyCategory.HOUSE || c == PropertyCategory.APARTMENT) {
            require(r.bedrooms() != null && r.bathrooms() != null,
                    "Bedrooms and bathrooms are required for " + c.name().toLowerCase() + " listings");
            require(r.floorAreaSqft() != null,
                    "Floor area is required for " + c.name().toLowerCase() + " listings");
        } else if (c == PropertyCategory.COMMERCIAL) {
            require(r.floorAreaSqft() != null || r.extentPerches() != null,
                    "Commercial listings need a floor area or a land extent");
        }

        if (r.listingType() == ListingType.SALE) {
            forbid(r.depositAmount() != null || r.availableFrom() != null,
                    "Deposit and available-from date apply only to rental listings");
        } else {
            forbid(c == PropertyCategory.LAND && r.furnishing() != null, "Land cannot be furnished");
        }
    }

    private void applyRequest(Property p, PropertyRequest r) {
        p.setTitle(r.title().trim());
        p.setDescription(r.description());
        p.setCategory(r.category());
        p.setListingType(r.listingType());
        p.setPrice(r.price());
        p.setAddress(r.address().trim());
        p.setDistrict(r.district().trim());
        p.setLatitude(r.latitude());
        p.setLongitude(r.longitude());

        p.setExtentPerches(r.extentPerches());
        p.setDeedType(r.deedType());
        p.setRoadAccessFt(r.roadAccessFt());
        p.setFacing(r.facing());
        p.setPricePerPerch(
                r.listingType() == ListingType.SALE && r.extentPerches() != null
                        ? r.price().divide(r.extentPerches(), 2, RoundingMode.HALF_UP)
                        : null);

        p.setBedrooms(r.bedrooms());
        p.setBathrooms(r.bathrooms());
        p.setFloorAreaSqft(r.floorAreaSqft());
        p.setFloors(r.floors());

        boolean rent = r.listingType() == ListingType.RENT;
        p.setMonthlyRent(rent ? r.price() : null);
        p.setDepositAmount(rent ? r.depositAmount() : null);
        p.setAvailableFrom(rent ? r.availableFrom() : null);
        p.setFurnishing(r.furnishing());

        p.setFeatures(r.features() == null ? new ArrayList<>() : new ArrayList<>(r.features()));

        p.getImages().clear();
        if (r.imageUrls() != null) {
            for (int i = 0; i < r.imageUrls().size(); i++) {
                PropertyImage image = new PropertyImage();
                image.setUrl(r.imageUrls().get(i));
                image.setSortOrder(i);
                p.addImage(image);
            }
        }
    }

    /** Generates a unique human-readable code such as PLT-2026-7KQ2MX. */
    String generateReferenceCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("PLT-").append(Year.now().getValue()).append('-');
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (repository.existsByReferenceCode(code));
        return code;
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new InvalidPropertyException(message);
    }

    private static void forbid(boolean condition, String message) {
        if (condition) throw new InvalidPropertyException(message);
    }
}
