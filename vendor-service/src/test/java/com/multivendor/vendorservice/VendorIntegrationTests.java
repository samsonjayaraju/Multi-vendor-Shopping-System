package com.multivendor.vendorservice;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VendorIntegrationTests {
  @Autowired private MockMvc mockMvc;

  private String createTestJwt(Long userId, String role) {
    String secret = "multivendor-local-jwt-secret-key-2026-secure";
    NimbusJwtEncoder encoder =
        new NimbusJwtEncoder(
            new ImmutableSecret<>(
                new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256")));
    Instant now = Instant.now();
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer("multivendor-auth")
            .subject(userId.toString())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(3600))
            .claim("userId", userId)
            .claim("role", role)
            .build();
    return encoder
        .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
        .getTokenValue();
  }

  @Test
  void registerAndFetchVendorFlow() throws Exception {
    String vendorToken = createTestJwt(10L, "VENDOR");
    String body =
        """
        {
          "name": "Nordic Design House",
          "email": "contact@nordicdesign.com",
          "contactNumber": "+1-555-234-5678",
          "description": "Minimalist Scandinavian home objects",
          "location": "Stockholm, SE"
        }
        """;

    mockMvc
        .perform(
            post("/api/vendors")
                .header("Authorization", "Bearer " + vendorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.vendorId").isNotEmpty())
        .andExpect(jsonPath("$.name").value("Nordic Design House"));

    mockMvc
        .perform(get("/api/vendors"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Nordic Design House"));

    mockMvc
        .perform(get("/api/vendors/me").header("Authorization", "Bearer " + vendorToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("contact@nordicdesign.com"));
  }
}
