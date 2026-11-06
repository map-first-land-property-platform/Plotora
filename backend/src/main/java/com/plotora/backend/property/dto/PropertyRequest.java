package com.plotora.backend.property.dto;

import com.plotora.backend.property.Furnishing;
import com.plotora.backend.property.ListingType;
import com.plotora.backend.property.PropertyCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request body used to create or update a seller's property listing.
 * Field-level rules live here; category-specific rules (e.g. land cannot
 * have bedrooms) are checked in {@code PropertyService}.
 */
public record PropertyRequest(
        @NotBlank @Size(min = 10, max = 200) String title,
        @Size(max = 5000) String description,
        @NotNull PropertyCategory category,
        @NotNull ListingType listingType,
        @NotNull @Positive @Digits(integer = 12, fraction = 2) BigDecimal price,

        @NotBlank @Size(max = 300) String address,
        @NotBlank @Size(max = 100) String district,
        // Sri Lanka bounding box
        @NotNull @DecimalMin(value = "5.9", message = "Latitude must be at least 5.9° N") @DecimalMax(value = "9.9", message = "Latitude must be at most 9.9° N") Double latitude,
        @NotNull @DecimalMin(value = "79.5", message = "Longitude must be at least 79.5° E") @DecimalMax(value = "81.9", message = "Longitude must be at most 81.9° E") Double longitude,

        @Positive @Digits(integer = 8, fraction = 2) BigDecimal extentPerches,
        @Size(max = 50) String deedType,
        @Positive @Digits(integer = 6, fraction = 2) BigDecimal roadAccessFt,
        @Size(max = 30) String facing,

        @Min(0) @Max(50) Integer bedrooms,
        @Min(0) @Max(50) Integer bathrooms,
        @Positive @Digits(integer = 8, fraction = 2) BigDecimal floorAreaSqft,
        @Min(1) @Max(200) Integer floors,

        @Positive @Digits(integer = 10, fraction = 2) BigDecimal depositAmount,
        LocalDate availableFrom,
        Furnishing furnishing,

        @Size(max = 30) List<@NotBlank @Size(max = 50) String> features,
        @Size(max = 10) List<@NotBlank @Size(max = 500) String> imageUrls
) {
}
