package com.multivendor.productservice;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.multivendor.productservice.client.VendorClient;
import com.multivendor.productservice.dto.VendorInfoDto;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductIntegrationTests {
  @Autowired private MockMvc mockMvc;

  @TestConfiguration
  static class StubConfig {
    @Bean
    @Primary
    VendorClient stubVendorClient() {
      return new VendorClient() {
        @Override
        public VendorInfoDto getVendorById(Long id) {
          return new VendorInfoDto(id, 10L, "Cupertino Audio Lab", "vendor@atelier.com", true);
        }

        @Override
        public VendorInfoDto getVendorByUserId(Long userId) {
          return new VendorInfoDto(1L, userId, "Cupertino Audio Lab", "vendor@atelier.com", true);
        }
      };
    }
  }

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
  void createProductListByVendorAndDeductStock() throws Exception {
    String vendorToken = createTestJwt(10L, "VENDOR");
    String productBody =
        """
        {
          "vendorId": 1,
          "name": "Studio Reference Monitor",
          "tagline": "Pure acoustic accuracy",
          "description": "Bi-amplified nearfield studio monitor",
          "category": "Audio",
          "price": 399.00,
          "stockQuantity": 10
        }
        """;

    mockMvc
        .perform(
            post("/api/products")
                .header("Authorization", "Bearer " + vendorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productBody))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.vendorId").value(1))
        .andExpect(jsonPath("$.vendorName").value("Cupertino Audio Lab"))
        .andExpect(jsonPath("$.stockQuantity").value(10));

    mockMvc
        .perform(get("/api/products/vendor/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Studio Reference Monitor"));

    mockMvc
        .perform(
            post("/internal/products/1/deduct-stock")
                .header("X-Internal-Key", "multivendor-internal-service-key-2026")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"quantity\": 3}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.stockQuantity").value(7));
  }
}
