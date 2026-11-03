package com.plotora.backend.controller;

import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.ListingType;
import com.plotora.backend.property.PropertyCategory;
import com.plotora.backend.property.dto.PropertyResponse;
import com.plotora.backend.property.exception.InvalidPropertyException;
import com.plotora.backend.property.exception.InvalidStatusTransitionException;
import com.plotora.backend.property.exception.PropertyNotFoundException;
import com.plotora.backend.property.service.PropertyService;
import com.plotora.backend.auth.JwtService;
import com.plotora.backend.config.SecurityConfig;
import com.plotora.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SellerPropertyController.class)
@Import(SecurityConfig.class)
class SellerPropertyControllerTest {

    private static final String BASE = "/api/v1/seller/properties";
    private static final UUID OWNER = UUID.randomUUID();
    private static final UUID ID = UUID.randomUUID();

    private static final String VALID_LAND_JSON = """
            {
              "title": "20 perch land in Habaraduwa",
              "category": "LAND",
              "listingType": "SALE",
              "price": 27000000,
              "address": "Main Road, Habaraduwa",
              "district": "Galle",
              "latitude": 6.0,
              "longitude": 80.3,
              "extentPerches": 20
            }
            """;

    @Autowired
    private WebApplicationContext context;

    private MockMvc mvc;

    @MockitoBean
    private PropertyService service;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository users;

    @org.junit.jupiter.api.BeforeEach
    void setUpMockMvc() {
        var authentication = UsernamePasswordAuthenticationToken.authenticated(OWNER, null, List.of());
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .defaultRequest(get("/").with(authentication(authentication)).with(csrf()))
                .build();
    }

    private static PropertyResponse response(ListingStatus status) {
        return new PropertyResponse(ID, "PLT-2026-AAAAAA", "20 perch land in Habaraduwa", null,
                PropertyCategory.LAND, ListingType.SALE, status, new BigDecimal("27000000"), "LKR",
                "Main Road, Habaraduwa", "Galle", 6.0, 80.3, new BigDecimal("20"),
                new BigDecimal("1350000"), null, null, null, null, null, null, null,
                null, null, null, null, List.of(), List.of(), OWNER, Instant.now(), Instant.now());
    }

    @Test
    void createReturns201WithLocation() throws Exception {
        when(service.create(any(), eq(OWNER))).thenReturn(response(ListingStatus.DRAFT));

        mvc.perform(post(BASE).header("X-User-Id", OWNER)
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_LAND_JSON))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.endsWith(BASE + "/" + ID)))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.referenceCode").value("PLT-2026-AAAAAA"));
    }

    @Test
    void createWithBlankTitleReturns400WithFieldErrors() throws Exception {
        String json = VALID_LAND_JSON.replace("\"20 perch land in Habaraduwa\"", "\"\"");

        mvc.perform(post(BASE).header("X-User-Id", OWNER)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
        verifyNoInteractions(service);
    }

    @Test
    void createOutsideSriLankaReturns400() throws Exception {
        String json = VALID_LAND_JSON.replace("\"latitude\": 6.0", "\"latitude\": 51.5");

        mvc.perform(post(BASE).header("X-User-Id", OWNER)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.latitude").exists());
    }

    @Test
    void categoryRuleViolationReturns400() throws Exception {
        when(service.create(any(), eq(OWNER)))
                .thenThrow(new InvalidPropertyException("Land listings cannot have bedrooms or bathrooms"));

        mvc.perform(post(BASE).header("X-User-Id", OWNER)
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_LAND_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Land listings cannot have bedrooms or bathrooms"));
    }

    @Test
    void missingUserHeaderReturns401() throws Exception {
        mvc.perform(get(BASE).with(anonymous())).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void getMyListingsReturnsList() throws Exception {
        when(service.getMyListings(eq(OWNER), isNull())).thenReturn(List.of(response(ListingStatus.DRAFT)));

        mvc.perform(get(BASE).header("X-User-Id", OWNER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(ID.toString()));
    }

    @Test
    void getMyListingsPassesStatusFilter() throws Exception {
        when(service.getMyListings(OWNER, ListingStatus.PUBLISHED)).thenReturn(List.of());

        mvc.perform(get(BASE).param("status", "PUBLISHED").header("X-User-Id", OWNER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void unknownOrForeignListingReturns404() throws Exception {
        when(service.getMyProperty(ID, OWNER)).thenThrow(new PropertyNotFoundException(ID));

        mvc.perform(get(BASE + "/" + ID).header("X-User-Id", OWNER))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateReturnsUpdatedListing() throws Exception {
        when(service.update(eq(ID), any(), eq(OWNER))).thenReturn(response(ListingStatus.DRAFT));

        mvc.perform(put(BASE + "/" + ID).header("X-User-Id", OWNER)
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_LAND_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ID.toString()));
    }

    @Test
    void submitReturnsPendingReview() throws Exception {
        when(service.submitForReview(ID, OWNER)).thenReturn(response(ListingStatus.PENDING_REVIEW));

        mvc.perform(post(BASE + "/" + ID + "/submit").header("X-User-Id", OWNER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
    }

    @Test
    void invalidTransitionReturns409() throws Exception {
        when(service.submitForReview(ID, OWNER))
                .thenThrow(new InvalidStatusTransitionException("Only DRAFT or REJECTED listings can be submitted"));

        mvc.perform(post(BASE + "/" + ID + "/submit").header("X-User-Id", OWNER))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteReturns204() throws Exception {
        mvc.perform(delete(BASE + "/" + ID).header("X-User-Id", OWNER))
                .andExpect(status().isNoContent());
    }

    @Test
    void deletePublishedReturns409() throws Exception {
        doThrow(new InvalidStatusTransitionException("Published or sold listings cannot be deleted"))
                .when(service).delete(ID, OWNER);

        mvc.perform(delete(BASE + "/" + ID).header("X-User-Id", OWNER))
                .andExpect(status().isConflict());
    }
}
