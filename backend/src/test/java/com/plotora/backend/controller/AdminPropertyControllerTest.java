package com.plotora.backend.controller;

import com.plotora.backend.auth.JwtService;
import com.plotora.backend.config.SecurityConfig;
import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.ListingType;
import com.plotora.backend.property.PropertyCategory;
import com.plotora.backend.property.dto.PropertyResponse;
import com.plotora.backend.property.exception.InvalidStatusTransitionException;
import com.plotora.backend.property.exception.PropertyNotFoundException;
import com.plotora.backend.property.service.PropertyService;
import com.plotora.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Admin listing review with the real security rules: ADMIN users only, CSRF on writes. */
@WebMvcTest(AdminPropertyController.class)
@Import(SecurityConfig.class)
class AdminPropertyControllerTest {

    private static final String BASE = "/api/v1/admin/properties";
    private static final UUID ADMIN = UUID.randomUUID();
    private static final UUID ID = UUID.randomUUID();
    private static final String REJECT_JSON = "{\"reason\": \"Please add the deed number.\"}";

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private PropertyService service;

    // Needed by SecurityConfig's JWT cookie filter; not used because tests authenticate directly.
    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private static RequestPostProcessor signedInAs(String role) {
        return authentication(UsernamePasswordAuthenticationToken.authenticated(
                ADMIN, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    private static RequestPostProcessor admin() {
        return signedInAs("ADMIN");
    }

    private static PropertyResponse response(ListingStatus status, String reason) {
        return new PropertyResponse(ID, "PLT-2026-AAAAAA", "20 perch land in Habaraduwa", null,
                PropertyCategory.LAND, ListingType.SALE, status, new BigDecimal("27000000"), "LKR",
                "Main Road, Habaraduwa", "Galle", 6.0, 80.3, new BigDecimal("20"),
                new BigDecimal("1350000"), null, null, null, null, null, null, null,
                null, null, null, null, List.of(), List.of(), UUID.randomUUID(), Instant.now(), Instant.now(),
                reason, Instant.now());
    }

    // ---------- security ----------

    @Test
    void notSignedInReturns401() throws Exception {
        mvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void sellerAccountReturns403() throws Exception {
        mvc.perform(get(BASE).with(signedInAs("SELLER"))).andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    @Test
    void buyerCannotApprove() throws Exception {
        mvc.perform(post(BASE + "/" + ID + "/approve").with(signedInAs("BUYER")).with(csrf()))
                .andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    @Test
    void approveWithoutCsrfTokenReturns403() throws Exception {
        mvc.perform(post(BASE + "/" + ID + "/approve").with(admin()))
                .andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    // ---------- review ----------

    @Test
    void listDefaultsToListingsWaitingForReview() throws Exception {
        when(service.getListingsForReview(isNull())).thenReturn(List.of(response(ListingStatus.PENDING_REVIEW, null)));

        mvc.perform(get(BASE).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING_REVIEW"));
    }

    @Test
    void listPassesStatusFilter() throws Exception {
        when(service.getListingsForReview(ListingStatus.REJECTED)).thenReturn(List.of());

        mvc.perform(get(BASE).param("status", "REJECTED").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void approvePublishesListingAsSignedInAdmin() throws Exception {
        when(service.approve(ID, ADMIN)).thenReturn(response(ListingStatus.PUBLISHED, null));

        mvc.perform(post(BASE + "/" + ID + "/approve").with(admin()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
        verify(service).approve(ID, ADMIN);
    }

    @Test
    void rejectStoresReason() throws Exception {
        when(service.reject(eq(ID), eq("Please add the deed number."), eq(ADMIN)))
                .thenReturn(response(ListingStatus.REJECTED, "Please add the deed number."));

        mvc.perform(post(BASE + "/" + ID + "/reject").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(REJECT_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Please add the deed number."));
    }

    @Test
    void rejectWithoutReasonReturns400() throws Exception {
        mvc.perform(post(BASE + "/" + ID + "/reject").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.reason").exists());
        verifyNoInteractions(service);
    }

    @Test
    void approvingNonPendingListingReturns409() throws Exception {
        when(service.approve(ID, ADMIN))
                .thenThrow(new InvalidStatusTransitionException("Only listings waiting for review can be approved or rejected"));

        mvc.perform(post(BASE + "/" + ID + "/approve").with(admin()).with(csrf()))
                .andExpect(status().isConflict());
    }

    @Test
    void approvingUnknownListingReturns404() throws Exception {
        when(service.approve(ID, ADMIN)).thenThrow(new PropertyNotFoundException(ID));

        mvc.perform(post(BASE + "/" + ID + "/approve").with(admin()).with(csrf()))
                .andExpect(status().isNotFound());
    }
}
