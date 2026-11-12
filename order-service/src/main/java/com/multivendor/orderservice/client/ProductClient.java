package com.multivendor.orderservice.client;

import com.multivendor.orderservice.dto.ProductInfoDto;
import com.multivendor.orderservice.dto.StockAdjustmentDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(primary = false, name = "product-service")
public interface ProductClient {
  @GetMapping("/internal/products/{id}")
  ProductInfoDto getProductById(@PathVariable("id") Long id);

  @PostMapping("/internal/products/{id}/deduct-stock")
  ProductInfoDto deductStock(
      @PathVariable("id") Long id, @RequestBody StockAdjustmentDto request);

  @PostMapping("/internal/products/{id}/restore-stock")
  ProductInfoDto restoreStock(
      @PathVariable("id") Long id, @RequestBody StockAdjustmentDto request);
}
