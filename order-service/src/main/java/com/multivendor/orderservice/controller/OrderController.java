package com.multivendor.orderservice.controller;

import com.multivendor.orderservice.dto.OrderResponse;
import com.multivendor.orderservice.dto.OrderStatusUpdateRequest;
import com.multivendor.orderservice.dto.PlaceOrderRequest;
import com.multivendor.orderservice.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public OrderResponse placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
    return orderService.placeOrder(request);
  }

  @GetMapping("/my")
  public List<OrderResponse> getMyOrders() {
    return orderService.getMyOrders();
  }

  @GetMapping("/user/{userId}")
  public List<OrderResponse> getByUser(@PathVariable("userId") Long userId) {
    return orderService.getOrdersByUser(userId);
  }

  @GetMapping("/vendor/my")
  public List<OrderResponse> getMyVendorOrders() {
    return orderService.getMyVendorOrders();
  }

  @GetMapping("/vendor/{vendorId}")
  public List<OrderResponse> getByVendor(@PathVariable("vendorId") Long vendorId) {
    return orderService.getOrdersByVendor(vendorId);
  }

  @GetMapping("/{id:[0-9]+}")
  public OrderResponse getById(@PathVariable("id") Long id) {
    return orderService.getOrderById(id);
  }

  @PutMapping("/{id:[0-9]+}/status")
  public OrderResponse updateStatusPut(
      @PathVariable("id") Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
    return orderService.updateOrderStatus(id, request.status());
  }

  @PatchMapping("/{id:[0-9]+}/status")
  public OrderResponse updateStatusPatch(
      @PathVariable("id") Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
    return orderService.updateOrderStatus(id, request.status());
  }
}
