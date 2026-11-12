package com.multivendor.orderservice.security;

import com.multivendor.orderservice.exception.ApiException;
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

  public static String name() {
    String n = jwt().getClaimAsString("name");
    return n != null ? n : jwt().getClaimAsString("email");
  }

  public static String role() {
    return jwt().getClaimAsString("role");
  }
}
