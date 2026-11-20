
package com.sanni.retailflow.order;

import com.sanni.retailflow.customer.Customer;
import com.sanni.retailflow.customer.CustomerRepository;
import com.sanni.retailflow.inventory.InventoryMovement;
import com.sanni.retailflow.inventory.InventoryMovementRepository;
import com.sanni.retailflow.inventory.MovementType;
import com.sanni.retailflow.product.Product;
import com.sanni.retailflow.product.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CustomerOrderRepository orderRepository;
    private final OrderItemRepository itemRepository;
    private final InventoryMovementRepository movementRepository;

    public OrderService(
        CustomerRepository customerRepository,
        ProductRepository productRepository,
        CustomerOrderRepository orderRepository,
        OrderItemRepository itemRepository,
        InventoryMovementRepository movementRepository
    ) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {

        Customer customer = customerRepository.findById(request.customerId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Customer not found"
            ));

        CustomerOrder order = new CustomerOrder(customer);

        orderRepository.save(order);

        BigDecimal totalAmount = BigDecimal.ZERO;

        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemRequest : request.items()) {

            Product product = productRepository
                .findByIdForUpdate(itemRequest.productId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found: " + itemRequest.productId()
                ));

            if (!product.isActive()) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Archived products cannot be added to new orders"
                );
            }

            int quantity = itemRequest.quantity();
            int currentStock = product.getStockQuantity();

            if (quantity > currentStock) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Insufficient stock for " + product.getName()
                    + ". Available: " + currentStock
                );
            }

            BigDecimal unitPrice = product.getPrice();

            BigDecimal subtotal = unitPrice.multiply(
                BigDecimal.valueOf(quantity)
            );

            OrderItem orderItem = new OrderItem(
                order,
                product,
                quantity,
                unitPrice
            );

            orderItems.add(orderItem);

            totalAmount = totalAmount.add(subtotal);

            product.setStockQuantity(currentStock - quantity);

            productRepository.save(product);

            InventoryMovement movement = new InventoryMovement(
                product,
                MovementType.OUT,
                quantity,
                "Customer order #" + order.getId()
            );

            movementRepository.save(movement);
        }

        order.setTotalAmount(totalAmount);

        orderRepository.save(order);

        itemRepository.saveAll(orderItems);

        return buildResponse(order, orderItems);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(order -> buildResponse(
                order,
                itemRepository.findByOrderId(order.getId())
            ))
            .toList();
    }

    public OrderResponse getOrderById(Long orderId) {

        CustomerOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Order not found"
            ));

        List<OrderItem> items = itemRepository.findByOrderId(orderId);

        return buildResponse(order, items);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getCustomerOrders(Long customerId) {

        if (!customerRepository.existsById(customerId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Customer not found"
            );
        }

        return orderRepository
            .findByCustomerIdOrderByCreatedAtDesc(customerId)
            .stream()
            .map(order -> buildResponse(
                order,
                itemRepository.findByOrderId(order.getId())
            ))
            .toList();
    }

    private OrderResponse buildResponse(
        CustomerOrder order,
        List<OrderItem> items
    ) {

        List<OrderItemResponse> itemResponses = items.stream()
            .map(item -> new OrderItemResponse(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
            ))
            .toList();

        return new OrderResponse(
            order.getId(),
            order.getCustomer().getId(),
            order.getCustomer().getFullName(),
            order.getStatus(),
            order.getTotalAmount(),
            order.getCreatedAt(),
            itemResponses
        );
    }
       @Transactional
        public OrderResponse updateOrderStatus(
        Long orderId,
        OrderStatusRequest request
) {
    CustomerOrder order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, "Order not found"
        ));

    OrderStatus currentStatus = order.getStatus();
    OrderStatus newStatus = request.status();

    if (currentStatus == newStatus) {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT, "Order already has this status"
        );
    }

    if (currentStatus == OrderStatus.CANCELLED
            || currentStatus == OrderStatus.DELIVERED) {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "This order can no longer be updated"
        );
    }

    if (newStatus == OrderStatus.CANCELLED) {
        List<OrderItem> items = itemRepository.findByOrderId(orderId);

        for (OrderItem item : items) {
            Product product = productRepository
                .findByIdForUpdate(item.getProduct().getId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Product not found"
                ));

            product.setStockQuantity(
                product.getStockQuantity() + item.getQuantity()
            );

            productRepository.save(product);

            InventoryMovement movement = new InventoryMovement(
                product,
                MovementType.IN,
                item.getQuantity(),
                "Cancellation of order #" + orderId
            );

            movementRepository.save(movement);
        }
    }

    order.setStatus(newStatus);
    orderRepository.save(order);

    List<OrderItem> items = itemRepository.findByOrderId(orderId);
return buildResponse(order, items);
}

}
