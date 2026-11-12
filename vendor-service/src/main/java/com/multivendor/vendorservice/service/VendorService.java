package com.multivendor.vendorservice.service;

import com.multivendor.vendorservice.dto.VendorRequest;
import com.multivendor.vendorservice.dto.VendorResponse;
import com.multivendor.vendorservice.entity.Vendor;
import com.multivendor.vendorservice.exception.ApiException;
import com.multivendor.vendorservice.repository.VendorRepository;
import com.multivendor.vendorservice.security.CurrentUser;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VendorService {
  private final VendorRepository vendorRepository;

  public VendorService(VendorRepository vendorRepository) {
    this.vendorRepository = vendorRepository;
  }

  public VendorResponse registerVendor(VendorRequest request) {
    CurrentUser.requireVendorOrAdmin();
    Long userId = CurrentUser.id();

    if (vendorRepository.findByUserId(userId).isPresent()) {
      throw new ApiException(
          HttpStatus.CONFLICT, "A vendor store is already registered for this user account");
    }

    String email = request.email().trim().toLowerCase();
    if (vendorRepository.existsByEmailIgnoreCase(email)) {
      throw new ApiException(HttpStatus.CONFLICT, "A vendor with this email already exists");
    }

    Vendor vendor = new Vendor();
    vendor.setUserId(userId);
    vendor.setName(request.name().trim());
    vendor.setEmail(email);
    vendor.setContactNumber(request.contactNumber().trim());
    vendor.setDescription(
        request.description() != null && !request.description().isBlank()
            ? request.description().trim()
            : "Curated design objects & essentials.");
    vendor.setLocation(
        request.location() != null && !request.location().isBlank()
            ? request.location().trim()
            : "San Francisco, CA");
    vendor.setActive(true);

    return VendorResponse.from(vendorRepository.save(vendor));
  }

  public VendorResponse updateVendor(Long vendorId, VendorRequest request) {
    CurrentUser.requireVendorOrAdmin();
    Vendor vendor =
        vendorRepository
            .findById(vendorId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found: " + vendorId));

    if (!"ADMIN".equals(CurrentUser.role())
        && vendor.getUserId() != null
        && !vendor.getUserId().equals(CurrentUser.id())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "You can only update your own vendor profile");
    }

    vendor.setName(request.name().trim());
    vendor.setEmail(request.email().trim().toLowerCase());
    vendor.setContactNumber(request.contactNumber().trim());
    if (request.description() != null) {
      vendor.setDescription(request.description().trim());
    }
    if (request.location() != null) {
      vendor.setLocation(request.location().trim());
    }

    return VendorResponse.from(vendorRepository.save(vendor));
  }

  @Transactional(readOnly = true)
  public List<VendorResponse> getAllVendors() {
    return vendorRepository.findByActiveTrueOrderByVendorIdAsc().stream()
        .map(VendorResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public VendorResponse getVendorById(Long vendorId) {
    Vendor vendor =
        vendorRepository
            .findById(vendorId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found: " + vendorId));
    return VendorResponse.from(vendor);
  }

  @Transactional(readOnly = true)
  public VendorResponse getMyVendorProfile() {
    Long userId = CurrentUser.id();
    Vendor vendor =
        vendorRepository
            .findByUserId(userId)
            .orElseThrow(
                () ->
                    new ApiException(
                        HttpStatus.NOT_FOUND,
                        "No vendor profile registered for user ID: " + userId));
    return VendorResponse.from(vendor);
  }

  @Transactional(readOnly = true)
  public VendorResponse getVendorByUserId(Long userId) {
    Vendor vendor =
        vendorRepository
            .findByUserId(userId)
            .orElseThrow(
                () ->
                    new ApiException(
                        HttpStatus.NOT_FOUND,
                        "No vendor profile registered for user ID: " + userId));
    return VendorResponse.from(vendor);
  }

  public void deactivateVendor(Long vendorId) {
    CurrentUser.requireVendorOrAdmin();
    Vendor vendor =
        vendorRepository
            .findById(vendorId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found: " + vendorId));
    if (!"ADMIN".equals(CurrentUser.role())
        && vendor.getUserId() != null
        && !vendor.getUserId().equals(CurrentUser.id())) {
      throw new ApiException(
          HttpStatus.FORBIDDEN, "You can only deactivate your own vendor profile");
    }
    vendor.setActive(false);
    vendorRepository.save(vendor);
  }
}
