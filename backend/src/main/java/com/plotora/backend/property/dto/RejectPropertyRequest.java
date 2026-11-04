package com.plotora.backend.property.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Reason shown to the seller when an admin rejects a listing. */
public record RejectPropertyRequest(@NotBlank @Size(min = 5, max = 500) String reason) {
}
