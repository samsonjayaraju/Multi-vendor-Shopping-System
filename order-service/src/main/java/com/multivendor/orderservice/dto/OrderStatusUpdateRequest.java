package com.multivendor.orderservice.dto;

import com.multivendor.orderservice.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
    @NotNull(message = "Order status is required") OrderStatus status) {}
