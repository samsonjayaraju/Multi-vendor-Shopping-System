package com.multivendor.productservice.repository;

import com.multivendor.productservice.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
  List<Product> findByVendorIdOrderByProductIdDesc(Long vendorId);

  List<Product> findByCategoryIgnoreCaseOrderByProductIdDesc(String category);

  List<Product> findAllByOrderByProductIdAsc();
}
