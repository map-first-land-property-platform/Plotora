package com.plotora.backend.property.exception;

import java.util.UUID;

/**
 * Thrown when a property does not exist OR belongs to another seller.
 * Both cases return 404 so we never reveal that someone else's listing exists.
 */
public class PropertyNotFoundException extends RuntimeException {
    public PropertyNotFoundException(UUID id) {
        super("Property not found: " + id);
    }
}
