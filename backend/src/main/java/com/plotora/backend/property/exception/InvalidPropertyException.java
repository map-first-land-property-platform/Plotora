package com.plotora.backend.property.exception;

/** Thrown when a request breaks a category- or listing-type-specific rule (HTTP 400). */
public class InvalidPropertyException extends RuntimeException {
    public InvalidPropertyException(String message) {
        super(message);
    }
}
