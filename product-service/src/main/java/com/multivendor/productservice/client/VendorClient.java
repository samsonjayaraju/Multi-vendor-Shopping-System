package com.multivendor.productservice.client;

import com.multivendor.productservice.dto.VendorInfoDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(primary = false, name = "vendor-service")
public interface VendorClient {
  @GetMapping("/internal/vendors/{id}")
  VendorInfoDto getVendorById(@PathVariable("id") Long id);

  @GetMapping("/internal/vendors/by-user/{userId}")
  VendorInfoDto getVendorByUserId(@PathVariable("userId") Long userId);
}
