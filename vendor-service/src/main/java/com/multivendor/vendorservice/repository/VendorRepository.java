package com.multivendor.vendorservice.repository;

import com.multivendor.vendorservice.entity.Vendor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
  Optional<Vendor> findByUserId(Long userId);

  Optional<Vendor> findByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCase(String email);

  List<Vendor> findByActiveTrueOrderByVendorIdAsc();
}
