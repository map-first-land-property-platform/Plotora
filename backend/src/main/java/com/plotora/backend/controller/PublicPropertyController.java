package com.plotora.backend.controller;

import com.plotora.backend.property.dto.PublicPropertyResponse;
import com.plotora.backend.property.service.PropertyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Read-only public API for listings that have completed the publishing workflow. */
@RestController
@RequestMapping("/api/v1/properties")
public class PublicPropertyController {
    private final PropertyService propertyService;

    public PublicPropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping
    public List<PublicPropertyResponse> getPublishedProperties() {
        return propertyService.getPublishedProperties();
    }

    @GetMapping("/{id}")
    public PublicPropertyResponse getPublishedProperty(@PathVariable UUID id) {
        return propertyService.getPublishedProperty(id);
    }
}
