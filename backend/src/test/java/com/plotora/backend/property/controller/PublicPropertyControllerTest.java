package com.plotora.backend.property.controller;

import com.plotora.backend.property.ListingStatus;
import com.plotora.backend.property.ListingType;
import com.plotora.backend.property.PropertyCategory;
import com.plotora.backend.auth.JwtService;
import com.plotora.backend.config.SecurityConfig;
import com.plotora.backend.property.dto.PublicPropertyResponse;
import com.plotora.backend.property.exception.PropertyNotFoundException;
import com.plotora.backend.property.service.PropertyService;
import com.plotora.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicPropertyController.class)
@Import(SecurityConfig.class)
class PublicPropertyControllerTest {
    private static final String BASE = "/api/v1/properties";
    private static final UUID ID = UUID.randomUUID();

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private PropertyService propertyService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository users;

    @Test
    void listReturnsOnlyPublicPropertyFieldsWithoutAuthentication() throws Exception {
        when(propertyService.getPublishedProperties()).thenReturn(List.of(response()));

        mvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(ID.toString()))
                .andExpect(jsonPath("$[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$[0].title").value("Published property"))
                .andExpect(jsonPath("$[0].ownerId").doesNotExist())
                .andExpect(jsonPath("$[0].updatedAt").doesNotExist());

        verify(propertyService).getPublishedProperties();
    }

    @Test
    void publishedDetailIsAvailableWithoutAuthentication() throws Exception {
        when(propertyService.getPublishedProperty(ID)).thenReturn(response());

        mvc.perform(get(BASE + "/" + ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ID.toString()))
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.ownerId").doesNotExist());
    }

    @Test
    void pendingPropertyIsNotExposed() throws Exception {
        when(propertyService.getPublishedProperty(ID)).thenThrow(new PropertyNotFoundException(ID));

        mvc.perform(get(BASE + "/" + ID)).andExpect(status().isNotFound());
    }

    @Test
    void missingPropertyIsNotExposed() throws Exception {
        UUID missingId = UUID.randomUUID();
        when(propertyService.getPublishedProperty(missingId)).thenThrow(new PropertyNotFoundException(missingId));

        mvc.perform(get(BASE + "/" + missingId)).andExpect(status().isNotFound());
    }

    @Test
    void sellerEndpointsRemainProtected() throws Exception {
        mvc.perform(get("/api/v1/seller/properties"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void onlyPublicGetRoutesArePermitted() throws Exception {
        mvc.perform(post(BASE)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get(BASE + "/nested/resource"))
                .andExpect(status().isUnauthorized());
    }

    private static PublicPropertyResponse response() {
        return new PublicPropertyResponse(
                ID, "PLT-2026-AAAAAA", "Published property", "Public description",
                PropertyCategory.LAND, ListingType.SALE, ListingStatus.PUBLISHED,
                new BigDecimal("27000000"), "LKR", "Main Road", "Galle", 6.0, 80.3,
                new BigDecimal("20"), new BigDecimal("1350000"), "Freehold",
                new BigDecimal("24"), "North", null, null, null, null,
                null, null, null, null, List.of(), List.of(), Instant.parse("2026-10-01T00:00:00Z"));
    }
}
