package com.plotora.backend.controller;

import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.dto.PropertyRequest;
import com.plotora.backend.property.dto.PropertyResponse;
import com.plotora.backend.property.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.UUID;

/**
 * Seller listing management API.
 *
 * TEMPORARY: the seller is identified by the {@code X-User-Id} header until the
 * Authentication module (Spring Security) is merged. Then replace the header with
 * the authenticated principal; nothing else in this class needs to change.
 */
@RestController
@RequestMapping("/api/v1/seller/properties")
public class SellerPropertyController {

    static final String USER_HEADER = "X-User-Id";

    private final PropertyService propertyService;

    public SellerPropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @PostMapping
    public ResponseEntity<PropertyResponse> create(
            @Valid @RequestBody PropertyRequest request,
            @RequestHeader(USER_HEADER) UUID ownerId) {
        PropertyResponse created = propertyService.create(request, ownerId);
        return ResponseEntity
                .created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}").buildAndExpand(created.id()).toUri())
                .body(created);
    }

    @GetMapping
    public List<PropertyResponse> getMyListings(
            @RequestHeader(USER_HEADER) UUID ownerId,
            @RequestParam(required = false) ListingStatus status) {
        return propertyService.getMyListings(ownerId, status);
    }

    @GetMapping("/{id}")
    public PropertyResponse getMyProperty(
            @PathVariable UUID id,
            @RequestHeader(USER_HEADER) UUID ownerId) {
        return propertyService.getMyProperty(id, ownerId);
    }

    @PutMapping("/{id}")
    public PropertyResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody PropertyRequest request,
            @RequestHeader(USER_HEADER) UUID ownerId) {
        return propertyService.update(id, request, ownerId);
    }

    @PostMapping("/{id}/submit")
    public PropertyResponse submitForReview(
            @PathVariable UUID id,
            @RequestHeader(USER_HEADER) UUID ownerId) {
        return propertyService.submitForReview(id, ownerId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader(USER_HEADER) UUID ownerId) {
        propertyService.delete(id, ownerId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
