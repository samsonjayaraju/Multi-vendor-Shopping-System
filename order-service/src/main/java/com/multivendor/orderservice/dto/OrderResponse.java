package com.multivendor.orderservice.dto;

import com.multivendor.orderservice.entity.Order;
import com.multivendor.orderservice.entity.OrderItem;
import com.multivendor.orderservice.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    Long orderId,
    Long userId,
    String customerName,
    BigDecimal totalAmount,
    OrderStatus orderStatus,
    String shippingAddress,
    Instant createdAt,
    List<OrderItemResponse> items) {

  public record OrderItemResponse(
      Long orderItemId,
      Long productId,
      String productName,
      Long vendorId,
      String vendorName,
      Integer quantity,
      BigDecimal unitPrice,
      BigDecimal subtotal,
      OrderStatus itemStatus) {
    public static OrderItemResponse from(OrderItem item) {
      return new OrderItemResponse(
          item.getOrderItemId(),
          item.getProductId(),
          item.getProductName(),
          item.getVendorId(),
          item.getVendorName(),
          item.getQuantity(),
          item.getUnitPrice(),
          item.getSubtotal(),
          item.getItemStatus());
    }
  }

  public static OrderResponse from(Order order) {
    return new OrderResponse(
        order.getOrderId(),
        order.getUserId(),
        order.getCustomerName(),
        order.getTotalAmount(),
        order.getOrderStatus(),
        order.getShippingAddress(),
        order.getCreatedAt(),
        order.getItems().stream().map(OrderItemResponse::from).toList());
  }
}
