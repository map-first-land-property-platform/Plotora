package com.plotora.backend.property.dto;

import com.plotora.backend.property.Furnishing;
import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.ListingType;
import com.plotora.backend.property.Property;
import com.plotora.backend.property.PropertyCategory;
import com.plotora.backend.property.PropertyImage;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** API representation of a property. Never exposes the JPA entity directly. */
public record PropertyResponse(
        UUID id,
        String referenceCode,
        String title,
        String description,
        PropertyCategory category,
        ListingType listingType,
        ListingStatus status,
        BigDecimal price,
        String currency,
        String address,
        String district,
        Double latitude,
        Double longitude,
        BigDecimal extentPerches,
        BigDecimal pricePerPerch,
        String deedType,
        BigDecimal roadAccessFt,
        String facing,
        Integer bedrooms,
        Integer bathrooms,
        BigDecimal floorAreaSqft,
        Integer floors,
        BigDecimal monthlyRent,
        BigDecimal depositAmount,
        LocalDate availableFrom,
        Furnishing furnishing,
        List<String> features,
        List<String> imageUrls,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt
) {
    public static PropertyResponse from(Property p) {
        return new PropertyResponse(
                p.getId(), p.getReferenceCode(), p.getTitle(), p.getDescription(),
                p.getCategory(), p.getListingType(), p.getStatus(),
                p.getPrice(), p.getCurrency(),
                p.getAddress(), p.getDistrict(), p.getLatitude(), p.getLongitude(),
                p.getExtentPerches(), p.getPricePerPerch(), p.getDeedType(),
                p.getRoadAccessFt(), p.getFacing(),
                p.getBedrooms(), p.getBathrooms(), p.getFloorAreaSqft(), p.getFloors(),
                p.getMonthlyRent(), p.getDepositAmount(), p.getAvailableFrom(), p.getFurnishing(),
                p.getFeatures() == null ? List.of() : List.copyOf(p.getFeatures()),
                p.getImages().stream().map(PropertyImage::getUrl).toList(),
                p.getOwnerId(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
