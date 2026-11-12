package com.multivendor.orderservice.service;

import com.multivendor.orderservice.client.ProductClient;
import com.multivendor.orderservice.client.VendorClient;
import com.multivendor.orderservice.dto.*;
import com.multivendor.orderservice.entity.Order;
import com.multivendor.orderservice.entity.OrderItem;
import com.multivendor.orderservice.enums.OrderStatus;
import com.multivendor.orderservice.exception.ApiException;
import com.multivendor.orderservice.repository.OrderRepository;
import com.multivendor.orderservice.security.CurrentUser;
import feign.FeignException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderService {
  private final OrderRepository orderRepository;
  private final ProductClient productClient;
  private final VendorClient vendorClient;

  public OrderService(
      OrderRepository orderRepository, ProductClient productClient, VendorClient vendorClient) {
    this.orderRepository = orderRepository;
    this.productClient = productClient;
    this.vendorClient = vendorClient;
  }

  public OrderResponse placeOrder(PlaceOrderRequest request) {
    Long userId = CurrentUser.id();
    String customerName = CurrentUser.name();

    Order order = new Order();
    order.setUserId(userId);
    order.setCustomerName(customerName);
    order.setOrderStatus(OrderStatus.PLACED);
    order.setShippingAddress(
        request.shippingAddress() != null && !request.shippingAddress().isBlank()
            ? request.shippingAddress().trim()
            : "1 Infinite Loop, Cupertino, CA 95014");

    BigDecimal totalAmount = BigDecimal.ZERO;
    List<PlaceOrderRequest.OrderItemRequest> deductedItems = new ArrayList<>();

    try {
      for (PlaceOrderRequest.OrderItemRequest itemReq : request.items()) {
        ProductInfoDto product =
            productClient.deductStock(
                itemReq.productId(), new StockAdjustmentDto(itemReq.quantity()));
        deductedItems.add(itemReq);

        BigDecimal unitPrice = product.price();
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity()));
        totalAmount = totalAmount.add(subtotal);

        OrderItem orderItem = new OrderItem();
        orderItem.setProductId(product.productId());
        orderItem.setProductName(product.name());
        orderItem.setVendorId(product.vendorId());
        orderItem.setVendorName(product.vendorName());
        orderItem.setQuantity(itemReq.quantity());
        orderItem.setUnitPrice(unitPrice);
        orderItem.setSubtotal(subtotal);
        orderItem.setItemStatus(OrderStatus.PLACED);
        order.addItem(orderItem);
      }
    } catch (FeignException ex) {
      // Compensate any deducted stock if a later item in the multi-vendor cart fails
      for (PlaceOrderRequest.OrderItemRequest deducted : deductedItems) {
        try {
          productClient.restoreStock(
              deducted.productId(), new StockAdjustmentDto(deducted.quantity()));
        } catch (Exception ignored) {
        }
      }
      if (ex.status() == 404) {
        throw new ApiException(HttpStatus.NOT_FOUND, "One or more products were not found");
      } else if (ex.status() == 409) {
        throw new ApiException(
            HttpStatus.CONFLICT, "Insufficient stock for one or more requested products");
      }
      throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE, "Product Service is currently unavailable");
    }

    order.setTotalAmount(totalAmount);
    return OrderResponse.from(orderRepository.save(order));
  }

  @Transactional(readOnly = true)
  public OrderResponse getOrderById(Long orderId) {
    Order order =
        orderRepository
            .findById(orderId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Order not found: " + orderId));
    return OrderResponse.from(order);
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> getMyOrders() {
    return orderRepository.findByUserIdOrderByCreatedAtDesc(CurrentUser.id()).stream()
        .map(OrderResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> getOrdersByUser(Long userId) {
    return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(OrderResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> getOrdersByVendor(Long vendorId) {
    return orderRepository.findOrdersByVendorId(vendorId).stream()
        .map(OrderResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> getMyVendorOrders() {
    try {
      VendorInfoDto vendor = vendorClient.getVendorByUserId(CurrentUser.id());
      return getOrdersByVendor(vendor.vendorId());
    } catch (FeignException.NotFound ex) {
      return List.of();
    } catch (FeignException ex) {
      throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE, "Unable to contact Vendor Service");
    }
  }

  public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
    Order order =
        orderRepository
            .findById(orderId)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "Order not found: " + orderId));

    if (order.getOrderStatus() == OrderStatus.CANCELLED) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Cancelled orders cannot be updated");
    }

    if (newStatus == OrderStatus.CANCELLED && order.getOrderStatus() != OrderStatus.CANCELLED) {
      for (OrderItem item : order.getItems()) {
        try {
          productClient.restoreStock(
              item.getProductId(), new StockAdjustmentDto(item.getQuantity()));
        } catch (Exception ignored) {
        }
      }
    }

    order.setOrderStatus(newStatus);
    for (OrderItem item : order.getItems()) {
      item.setItemStatus(newStatus);
    }

    return OrderResponse.from(orderRepository.save(order));
  }
}
