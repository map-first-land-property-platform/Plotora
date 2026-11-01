package com.plotora.backend.property.exception;

/** Thrown when an action is not allowed in the listing's current status (HTTP 409). */
public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(String message) {
        super(message);
    }
}
