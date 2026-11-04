package com.plotora.backend.controller;

import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.dto.PropertyResponse;
import com.plotora.backend.property.dto.RejectPropertyRequest;
import com.plotora.backend.property.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Listing review for admins: approve (publish) or reject listings that sellers submitted.
 * Access is limited to users with the ADMIN role in {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/v1/admin/properties")
public class AdminPropertyController {

    private final PropertyService propertyService;

    public AdminPropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    /** Listings by status, oldest first; defaults to listings waiting for review. */
    @GetMapping
    public List<PropertyResponse> list(@RequestParam(required = false) ListingStatus status) {
        return propertyService.getListingsForReview(status);
    }

    @PostMapping("/{id}/approve")
    public PropertyResponse approve(@PathVariable UUID id, @AuthenticationPrincipal UUID adminId) {
        return propertyService.approve(id, adminId);
    }

    @PostMapping("/{id}/reject")
    public PropertyResponse reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectPropertyRequest request,
            @AuthenticationPrincipal UUID adminId) {
        return propertyService.reject(id, request.reason(), adminId);
    }
}
