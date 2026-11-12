package com.multivendor.orderservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PlaceOrderRequest(
    @Size(max = 350) String shippingAddress,
    @NotEmpty(message = "Order must contain at least one item") @Valid List<OrderItemRequest> items) {

  public record OrderItemRequest(
      @NotNull(message = "Product ID is required") Long productId,
      @NotNull(message = "Quantity is required") @Min(value = 1, message = "Quantity must be at least 1") Integer quantity) {}
}
