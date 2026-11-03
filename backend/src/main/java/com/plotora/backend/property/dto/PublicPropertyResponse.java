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

/** Public listing data. Seller identity and internal update metadata are intentionally omitted. */
public record PublicPropertyResponse(
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
        List<PublicImage> images,
        Instant createdAt
) {
    public record PublicImage(String url, String alt, int order) {}

    public static PublicPropertyResponse from(Property property) {
        return new PublicPropertyResponse(
                property.getId(), property.getReferenceCode(), property.getTitle(), property.getDescription(),
                property.getCategory(), property.getListingType(), property.getStatus(),
                property.getPrice(), property.getCurrency(), property.getAddress(), property.getDistrict(),
                property.getLatitude(), property.getLongitude(), property.getExtentPerches(),
                property.getPricePerPerch(), property.getDeedType(), property.getRoadAccessFt(),
                property.getFacing(), property.getBedrooms(), property.getBathrooms(),
                property.getFloorAreaSqft(), property.getFloors(), property.getMonthlyRent(),
                property.getDepositAmount(), property.getAvailableFrom(), property.getFurnishing(),
                property.getFeatures() == null ? List.of() : List.copyOf(property.getFeatures()),
                property.getImages().stream()
                        .map(image -> new PublicImage(image.getUrl(), image.getAlt(), image.getSortOrder()))
                        .toList(),
                property.getCreatedAt()
        );
    }
}
