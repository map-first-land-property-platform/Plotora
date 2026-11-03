package com.plotora.backend.property.repository;

import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {

    List<Property> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Property> findByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, ListingStatus status);

    Optional<Property> findByIdAndOwnerId(UUID id, UUID ownerId);

    List<Property> findByStatusOrderByCreatedAtDesc(ListingStatus status);

    Optional<Property> findByIdAndStatus(UUID id, ListingStatus status);

    boolean existsByReferenceCode(String referenceCode);
}
