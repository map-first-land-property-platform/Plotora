package com.plotora.backend.controller;

import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.dto.PropertyRequest;
import com.plotora.backend.property.dto.PropertyResponse;
import com.plotora.backend.property.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.UUID;

/**
 * Seller listing management API.
 *
 * The seller is the signed-in user: {@code JwtCookieAuthenticationFilter} puts the
 * user's id in the security context as the principal. Access is limited to users
 * with the SELLER role in {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/api/v1/seller/properties")
public class SellerPropertyController {

    private final PropertyService propertyService;

    public SellerPropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @PostMapping
    public ResponseEntity<PropertyResponse> create(
            @Valid @RequestBody PropertyRequest request,
            @AuthenticationPrincipal UUID ownerId) {
        PropertyResponse created = propertyService.create(request, ownerId);
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}").buildAndExpand(created.id()).toUri())
                .body(created);
    }

    @GetMapping
    public List<PropertyResponse> getMyListings(
            @AuthenticationPrincipal UUID ownerId,
            @RequestParam(required = false) ListingStatus status) {
        return propertyService.getMyListings(ownerId, status);
    }

    @GetMapping("/{id}")
    public PropertyResponse getMyProperty(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID ownerId) {
        return propertyService.getMyProperty(id, ownerId);
    }

    @PutMapping("/{id}")
    public PropertyResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody PropertyRequest request,
            @AuthenticationPrincipal UUID ownerId) {
        return propertyService.update(id, request, ownerId);
    }

    @PostMapping("/{id}/submit")
    public PropertyResponse submitForReview(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID ownerId) {
        return propertyService.submitForReview(id, ownerId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID ownerId) {
        propertyService.delete(id, ownerId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
