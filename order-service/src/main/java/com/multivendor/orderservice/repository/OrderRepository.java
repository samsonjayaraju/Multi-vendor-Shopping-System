package com.multivendor.orderservice.repository;

import com.multivendor.orderservice.entity.Order;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
  List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

  @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.vendorId = :vendorId ORDER BY o.createdAt DESC")
  List<Order> findOrdersByVendorId(@Param("vendorId") Long vendorId);

  List<Order> findAllByOrderByCreatedAtDesc();
}
