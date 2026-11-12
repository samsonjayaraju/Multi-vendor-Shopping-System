package com.multivendor.productservice.security;

import com.multivendor.productservice.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public final class CurrentUser {
  private CurrentUser() {}

  private static Jwt jwt() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return jwt;
  }

  public static Long id() {
    return ((Number) jwt().getClaim("userId")).longValue();
  }

  public static String role() {
    return jwt().getClaimAsString("role");
  }

  public static void requireVendorOrAdmin() {
    String r = role();
    if (!"VENDOR".equals(r) && !"ADMIN".equals(r)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Requires VENDOR role");
    }
  }
}
