package com.sanni.retailflow.order;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
        @Valid @RequestBody OrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.createOrder(request));
    }

    @GetMapping("/{id}")
    public OrderResponse getOrderById(@PathVariable Long id) {
        return service.getOrderById(id);
    }

    @GetMapping("/customer/{customerId}")
    public List<OrderResponse> getCustomerOrders(
        @PathVariable Long customerId
    ) {
        return service.getCustomerOrders(customerId);
    }

    @PatchMapping("/{id}/status")
public OrderResponse updateOrderStatus(
    @PathVariable Long id,
    @Valid @RequestBody OrderStatusRequest request
) {
    return service.updateOrderStatus(id, request);
}
}
