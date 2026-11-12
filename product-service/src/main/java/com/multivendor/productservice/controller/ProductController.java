package com.multivendor.productservice.controller;

import com.multivendor.productservice.dto.ProductRequest;
import com.multivendor.productservice.dto.ProductResponse;
import com.multivendor.productservice.dto.StockAdjustmentRequest;
import com.multivendor.productservice.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductController {
  private final ProductService productService;

  public ProductController(ProductService productService) {
    this.productService = productService;
  }

  @GetMapping("/api/products")
  public List<ProductResponse> getAll(
      @RequestParam(name = "vendorId", required = false) Long vendorId,
      @RequestParam(name = "category", required = false) String category,
      @RequestParam(name = "search", required = false) String search) {
    return productService.getAllProducts(vendorId, category, search);
  }

  @GetMapping("/api/products/vendor/{vendorId}")
  public List<ProductResponse> getByVendor(@PathVariable("vendorId") Long vendorId) {
    return productService.getProductsByVendor(vendorId);
  }

  @GetMapping("/api/products/{id:[0-9]+}")
  public ProductResponse getById(@PathVariable("id") Long id) {
    return productService.getProductById(id);
  }

  @PostMapping("/api/products")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse create(@Valid @RequestBody ProductRequest request) {
    return productService.createProduct(request);
  }

  @PutMapping("/api/products/{id:[0-9]+}")
  public ProductResponse update(
      @PathVariable("id") Long id, @Valid @RequestBody ProductRequest request) {
    return productService.updateProduct(id, request);
  }

  @DeleteMapping("/api/products/{id:[0-9]+}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable("id") Long id) {
    productService.deleteProduct(id);
  }

  // Internal service-to-service endpoints for Order Service
  @GetMapping("/internal/products/{id}")
  public ProductResponse getInternalById(@PathVariable("id") Long id) {
    return productService.getProductById(id);
  }

  @PostMapping("/internal/products/{id}/deduct-stock")
  public ProductResponse deductStock(
      @PathVariable("id") Long id, @Valid @RequestBody StockAdjustmentRequest request) {
    return productService.deductStock(id, request.quantity());
  }

  @PostMapping("/internal/products/{id}/restore-stock")
  public ProductResponse restoreStock(
      @PathVariable("id") Long id, @Valid @RequestBody StockAdjustmentRequest request) {
    return productService.restoreStock(id, request.quantity());
  }
}
