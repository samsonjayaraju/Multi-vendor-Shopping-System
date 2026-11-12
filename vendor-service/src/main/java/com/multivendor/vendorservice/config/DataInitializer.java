package com.multivendor.vendorservice.config;

import com.multivendor.vendorservice.entity.Vendor;
import com.multivendor.vendorservice.repository.VendorRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class DataInitializer {
  @Bean
  CommandLineRunner seedVendors(VendorRepository vendorRepository) {
    return args -> {
      if (vendorRepository.count() == 0) {
        Vendor v1 = new Vendor();
        v1.setUserId(1L);
        v1.setName("Cupertino Audio Lab");
        v1.setEmail("vendor1@atelier.com");
        v1.setContactNumber("+1 (408) 555-0192");
        v1.setDescription(
            "Precision acoustic instruments, spatial headphones, and anodized aluminum desk hardware.");
        v1.setLocation("Cupertino, CA");
        v1.setActive(true);
        vendorRepository.save(v1);

        Vendor v2 = new Vendor();
        v2.setUserId(2L);
        v2.setName("Studio Minimalist Co.");
        v2.setEmail("vendor2@atelier.com");
        v2.setContactNumber("+1 (415) 555-0148");
        v2.setDescription(
            "Architectural workspace lighting, tactile mechanical keyboards, and leather desk folios.");
        v2.setLocation("San Francisco, CA");
        v2.setActive(true);
        vendorRepository.save(v2);

        Vendor v3 = new Vendor();
        v3.setUserId(99L);
        v3.setName("Kyoto Craft & Optics");
        v3.setEmail("kyoto@atelier.com");
        v3.setContactNumber("+81 75-555-0180");
        v3.setDescription(
            "Hand-finished titanium optical frames, analog timepieces, and ceramic pour-over vessels.");
        v3.setLocation("Kyoto, JP");
        v3.setActive(true);
        vendorRepository.save(v3);
      }
    };
  }
}
