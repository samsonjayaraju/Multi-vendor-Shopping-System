package com.multivendor.productservice.config;

import com.multivendor.productservice.entity.Product;
import com.multivendor.productservice.repository.ProductRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class DataInitializer {
  @Bean
  CommandLineRunner seedProducts(ProductRepository productRepository) {
    return args -> {
      if (productRepository.count() == 0) {
        saveProduct(
            productRepository,
            1L,
            "Cupertino Audio Lab",
            "Acoustic Reference Studio Headphones",
            "Spatial clarity. Zero compromise.",
            "Machined from solid billet aluminum with custom 50mm beryllium drivers and memory-foam lambskin cushions.",
            "Audio",
            new BigDecimal("549.00"),
            18);

        saveProduct(
            productRepository,
            1L,
            "Cupertino Audio Lab",
            "DAC-01 Desktop Amplifier",
            "Pure analog warmth from digital masters.",
            "Balanced Class-A headphone amplifier with stepped attenuator volume control and USB-C lossless input.",
            "Audio",
            new BigDecimal("329.00"),
            12);

        saveProduct(
            productRepository,
            2L,
            "Studio Minimalist Co.",
            "Monolith Mechanical Keyboard",
            "Tactile typography for modern creators.",
            "Gasket-mounted 65% wireless mechanical keyboard with CNC bead-blasted chassis and PBT keycaps.",
            "Workspace",
            new BigDecimal("289.00"),
            25);

        saveProduct(
            productRepository,
            2L,
            "Studio Minimalist Co.",
            "Luminaire Task Bar Pro",
            "Daylight-calibrated asymmetric illumination.",
            "CRI 98+ architectural desk lamp with touch-capacitive dimming and zero screen glare.",
            "Workspace",
            new BigDecimal("195.00"),
            30);

        saveProduct(
            productRepository,
            3L,
            "Kyoto Craft & Optics",
            "Sabae Titanium Optical Frame",
            "Featherweight geometry. Hand-polished in Japan.",
            "Beta-titanium eyewear frame with blue-light anti-reflective coated lenses and custom hinge engineering.",
            "Optics & Craft",
            new BigDecimal("410.00"),
            14);

        saveProduct(
            productRepository,
            3L,
            "Kyoto Craft & Optics",
            "Arita Porcelain Pour-Over Set",
            "Slow-brewed ritual in matte white glaze.",
            "400-year heritage Japanese porcelain dripper and server engineered for optimal thermal retention.",
            "Optics & Craft",
            new BigDecimal("145.00"),
            22);
      }
    };
  }

  private void saveProduct(
      ProductRepository repo,
      Long vendorId,
      String vendorName,
      String name,
      String tagline,
      String description,
      String category,
      BigDecimal price,
      Integer stock) {
    Product p = new Product();
    p.setVendorId(vendorId);
    p.setVendorName(vendorName);
    p.setName(name);
    p.setTagline(tagline);
    p.setDescription(description);
    p.setCategory(category);
    p.setPrice(price);
    p.setStockQuantity(stock);
    repo.save(p);
  }
}
