package com.multivendor.productservice.service;

import com.multivendor.productservice.client.VendorClient;
import com.multivendor.productservice.dto.ProductRequest;
import com.multivendor.productservice.dto.ProductResponse;
import com.multivendor.productservice.dto.VendorInfoDto;
import com.multivendor.productservice.entity.Product;
import com.multivendor.productservice.exception.ApiException;
import com.multivendor.productservice.repository.ProductRepository;
import com.multivendor.productservice.security.CurrentUser;
import feign.FeignException;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductService {
  private final ProductRepository productRepository;
  private final VendorClient vendorClient;

  public ProductService(ProductRepository productRepository, VendorClient vendorClient) {
    this.productRepository = productRepository;
    this.vendorClient = vendorClient;
  }

  public ProductResponse createProduct(ProductRequest request) {
    CurrentUser.requireVendorOrAdmin();
    VendorInfoDto vendor = resolveAndVerifyVendor(request.vendorId());

    Product product = new Product();
    product.setVendorId(vendor.vendorId());
    product.setVendorName(vendor.name());
    product.setName(request.name().trim());
    product.setTagline(
        request.tagline() != null && !request.tagline().isBlank()
            ? request.tagline().trim()
            : "Designed for everyday precision.");
    product.setDescription(
        request.description() != null && !request.description().isBlank()
            ? request.description().trim()
            : "Crafted with meticulous attention to material and form.");
    product.setCategory(
        request.category() != null && !request.category().isBlank()
            ? request.category().trim()
            : "Essentials");
    product.setPrice(request.price());
    product.setStockQuantity(request.stockQuantity());

    return ProductResponse.from(productRepository.save(product));
  }

  public ProductResponse updateProduct(Long productId, ProductRequest request) {
    CurrentUser.requireVendorOrAdmin();
    Product product =
        productRepository
            .findById(productId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Product not found: " + productId));

    VendorInfoDto vendor = resolveAndVerifyVendor(product.getVendorId());
    product.setVendorName(vendor.name());
    product.setName(request.name().trim());
    if (request.tagline() != null) {
      product.setTagline(request.tagline().trim());
    }
    if (request.description() != null) {
      product.setDescription(request.description().trim());
    }
    if (request.category() != null) {
      product.setCategory(request.category().trim());
    }
    product.setPrice(request.price());
    product.setStockQuantity(request.stockQuantity());

    return ProductResponse.from(productRepository.save(product));
  }

  public void deleteProduct(Long productId) {
    CurrentUser.requireVendorOrAdmin();
    Product product =
        productRepository
            .findById(productId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Product not found: " + productId));
    resolveAndVerifyVendor(product.getVendorId());
    productRepository.delete(product);
  }

  @Transactional(readOnly = true)
  public List<ProductResponse> getAllProducts(Long vendorId, String category, String search) {
    List<Product> products;
    if (vendorId != null) {
      products = productRepository.findByVendorIdOrderByProductIdDesc(vendorId);
    } else if (category != null && !category.isBlank()) {
      products = productRepository.findByCategoryIgnoreCaseOrderByProductIdDesc(category.trim());
    } else {
      products = productRepository.findAllByOrderByProductIdAsc();
    }

    if (search != null && !search.isBlank()) {
      String q = search.trim().toLowerCase(Locale.ROOT);
      products =
          products.stream()
              .filter(
                  p ->
                      p.getName().toLowerCase(Locale.ROOT).contains(q)
                          || (p.getVendorName() != null
                              && p.getVendorName().toLowerCase(Locale.ROOT).contains(q))
                          || (p.getCategory() != null
                              && p.getCategory().toLowerCase(Locale.ROOT).contains(q))
                          || (p.getDescription() != null
                              && p.getDescription().toLowerCase(Locale.ROOT).contains(q)))
              .toList();
    }

    return products.stream().map(ProductResponse::from).toList();
  }

  @Transactional(readOnly = true)
  public List<ProductResponse> getProductsByVendor(Long vendorId) {
    return productRepository.findByVendorIdOrderByProductIdDesc(vendorId).stream()
        .map(ProductResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public ProductResponse getProductById(Long productId) {
    Product product =
        productRepository
            .findById(productId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Product not found: " + productId));
    return ProductResponse.from(product);
  }

  public ProductResponse deductStock(Long productId, int quantity) {
    Product product =
        productRepository
            .findById(productId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Product not found: " + productId));
    if (product.getStockQuantity() < quantity) {
      throw new ApiException(
          HttpStatus.CONFLICT,
          "Insufficient stock for product '"
              + product.getName()
              + "'. Available: "
              + product.getStockQuantity());
    }
    product.setStockQuantity(product.getStockQuantity() - quantity);
    return ProductResponse.from(productRepository.save(product));
  }

  public ProductResponse restoreStock(Long productId, int quantity) {
    Product product =
        productRepository
            .findById(productId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Product not found: " + productId));
    product.setStockQuantity(product.getStockQuantity() + quantity);
    return ProductResponse.from(productRepository.save(product));
  }

  private VendorInfoDto resolveAndVerifyVendor(Long requestedVendorId) {
    try {
      VendorInfoDto vendor;
      if (requestedVendorId != null) {
        vendor = vendorClient.getVendorById(requestedVendorId);
      } else {
        vendor = vendorClient.getVendorByUserId(CurrentUser.id());
      }
      if (!vendor.active()) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor account is inactive");
      }
      if (!"ADMIN".equals(CurrentUser.role())
          && vendor.userId() != null
          && !vendor.userId().equals(CurrentUser.id())) {
        throw new ApiException(
            HttpStatus.FORBIDDEN, "You can only manage products for your own vendor store");
      }
      return vendor;
    } catch (FeignException.NotFound ex) {
      throw new ApiException(
          HttpStatus.NOT_FOUND,
          "Vendor profile not found. Please register your vendor store first.");
    } catch (FeignException ex) {
      throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE, "Unable to verify vendor with Vendor Service");
    }
  }
}
