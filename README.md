# 10. Multi-Vendor Shopping System

A microservices-based **Multi-Vendor Shopping System** built with **Spring Boot 3.5 (Java 21)**, **Spring Cloud (Netflix Eureka, API Gateway, OpenFeign)**, **JWT Security**, **MySQL**, and an **Apple-style React Frontend** (combining bold, editorial italic, and normal typography on a crisp white `#FFFFFF` canvas).

---

## Folder Structure (Separate Folders per Service)

| Folder | Service Name | Port | Database Schema | Description |
| :--- | :--- | :--- | :--- | :--- |
| `eureka-server/` | `eureka-server` | `8761` | — | Netflix Eureka Service Discovery Server |
| `api-gateway/` | `api-gateway` | `8080` | — | Spring Cloud Gateway routing `/api/**` + CORS + header sanitization |
| `user-service/` | `user-service` | `8081` | `multivendor_user` | User registration, login, and HS256 JWT token issuance |
| `vendor-service/` | `vendor-service` | `8082` | `multivendor_vendor` | Vendor registration, profile management, and internal vendor verification |
| `product-service/` | `product-service` | `8083` | `multivendor_product` | Product catalog per vendor, stock deduction/restoration, OpenFeign client to Vendor Service |
| `order-service/` | `order-service` | `8084` | `multivendor_order` | Multi-vendor order placement, status tracking, OpenFeign client to Product & Vendor Services |
| `frontend/` | React Storefront | `5173` | — | Apple-style UI with Storefront, Vendor Directory, Order Tracking, and Vendor Studio |

---

## Database Tables (MySQL)

1. **`multivendor_vendor.vendors`**
   - `vendor_id` (PK), `user_id`, `name`, `email`, `contact_number`, `description`, `location`, `active`, `created_at`
2. **`multivendor_product.products`**
   - `product_id` (PK), `vendor_id` (FK), `vendor_name`, `name`, `tagline`, `description`, `category`, `price`, `stock_quantity`, `created_at`
3. **`multivendor_order.orders` & `multivendor_order.order_items`**
   - `orders`: `order_id` (PK), `user_id` (FK), `customer_name`, `total_amount`, `order_status`, `shipping_address`, `created_at`
   - `order_items`: `order_item_id` (PK), `order_id` (FK), `product_id` (FK), `product_name`, `vendor_id` (FK), `vendor_name`, `quantity`, `unit_price`, `subtotal`, `item_status`
4. **`multivendor_user.users`**
   - `user_id` (PK), `name`, `email`, `password`, `role` (`CUSTOMER`, `VENDOR`, `ADMIN`), `created_at`

---

## Quick Start

### Start All Microservices + React Frontend
```bash
chmod +x start-all.sh stop-all.sh
./start-all.sh
```
- **React Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **Eureka Server Dashboard**: http://localhost:8761

### Default Seeded Demo Accounts (Password: `password123`)
- **Customer**: `customer@atelier.com` / `password123`
- **Vendor 1 (Cupertino Audio Lab)**: `vendor1@atelier.com` / `password123`
- **Vendor 2 (Studio Minimalist Co.)**: `vendor2@atelier.com` / `password123`
