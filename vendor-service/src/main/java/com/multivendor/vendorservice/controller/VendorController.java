package com.multivendor.vendorservice.controller;

import com.multivendor.vendorservice.dto.VendorRequest;
import com.multivendor.vendorservice.dto.VendorResponse;
import com.multivendor.vendorservice.service.VendorService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
public class VendorController {
  private final VendorService vendorService;

  public VendorController(VendorService vendorService) {
    this.vendorService = vendorService;
  }

  @GetMapping("/api/vendors")
  public List<VendorResponse> getAll() {
    return vendorService.getAllVendors();
  }

  @GetMapping("/api/vendors/{id:[0-9]+}")
  public VendorResponse getById(@PathVariable("id") Long id) {
    return vendorService.getVendorById(id);
  }

  @GetMapping("/api/vendors/me")
  public VendorResponse getMyProfile() {
    return vendorService.getMyVendorProfile();
  }

  @PostMapping("/api/vendors")
  @ResponseStatus(HttpStatus.CREATED)
  public VendorResponse register(@Valid @RequestBody VendorRequest request) {
    return vendorService.registerVendor(request);
  }

  @PutMapping("/api/vendors/{id:[0-9]+}")
  public VendorResponse update(
      @PathVariable("id") Long id, @Valid @RequestBody VendorRequest request) {
    return vendorService.updateVendor(id, request);
  }

  @DeleteMapping("/api/vendors/{id:[0-9]+}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable("id") Long id) {
    vendorService.deactivateVendor(id);
  }

  // Internal service-to-service endpoints
  @GetMapping("/internal/vendors/{id}")
  public VendorResponse getInternalById(@PathVariable("id") Long id) {
    return vendorService.getVendorById(id);
  }

  @GetMapping("/internal/vendors/by-user/{userId}")
  public VendorResponse getInternalByUserId(@PathVariable("userId") Long userId) {
    return vendorService.getVendorByUserId(userId);
  }
}
