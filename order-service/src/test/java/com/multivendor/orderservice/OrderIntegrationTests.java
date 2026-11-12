package com.multivendor.orderservice;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.multivendor.orderservice.client.ProductClient;
import com.multivendor.orderservice.client.VendorClient;
import com.multivendor.orderservice.dto.ProductInfoDto;
import com.multivendor.orderservice.dto.StockAdjustmentDto;
import com.multivendor.orderservice.dto.VendorInfoDto;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.math.BigDecimal;
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
class OrderIntegrationTests {
  @Autowired private MockMvc mockMvc;

  @TestConfiguration
  static class StubClientsConfig {
    @Bean
    @Primary
    ProductClient stubProductClient() {
      return new ProductClient() {
        @Override
        public ProductInfoDto getProductById(Long id) {
          if (id == 1L) {
            return new ProductInfoDto(
                1L, 1L, "Cupertino Audio Lab", "Studio Headphones", new BigDecimal("500.00"), 10);
          }
          return new ProductInfoDto(
              2L, 2L, "Studio Minimalist Co.", "Monolith Keyboard", new BigDecimal("250.00"), 10);
        }

        @Override
        public ProductInfoDto deductStock(Long id, StockAdjustmentDto request) {
          return getProductById(id);
        }

        @Override
        public ProductInfoDto restoreStock(Long id, StockAdjustmentDto request) {
          return getProductById(id);
        }
      };
    }

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
            .claim("name", "Samson Customer")
            .claim("role", role)
            .build();
    return encoder
        .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
        .getTokenValue();
  }

  @Test
  void multiVendorOrderPlacementAndTrackingFlow() throws Exception {
    String customerToken = createTestJwt(5L, "CUSTOMER");
    String vendorToken = createTestJwt(10L, "VENDOR");

    String orderJson =
        """
        {
          "shippingAddress": "1 Infinite Loop, Cupertino, CA",
          "items": [
            { "productId": 1, "quantity": 1 },
            { "productId": 2, "quantity": 2 }
          ]
        }
        """;

    mockMvc
        .perform(
            post("/api/orders")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderJson))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.orderId").value(1))
        .andExpect(jsonPath("$.totalAmount").value(1000.00))
        .andExpect(jsonPath("$.orderStatus").value("PLACED"))
        .andExpect(jsonPath("$.items.length()").value(2));

    // Vendor 1 checks orders containing their products
    mockMvc
        .perform(get("/api/orders/vendor/1").header("Authorization", "Bearer " + vendorToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].orderId").value(1));

    // Vendor 2 also sees the multi-vendor order containing their products
    mockMvc
        .perform(get("/api/orders/vendor/2").header("Authorization", "Bearer " + vendorToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].orderId").value(1));

    // Update order status to SHIPPED
    mockMvc
        .perform(
            put("/api/orders/1/status")
                .header("Authorization", "Bearer " + vendorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"SHIPPED\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.orderStatus").value("SHIPPED"));
  }
}
