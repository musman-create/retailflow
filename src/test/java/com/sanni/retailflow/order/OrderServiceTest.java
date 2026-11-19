
package com.sanni.retailflow.order;

import com.sanni.retailflow.customer.Customer;
import com.sanni.retailflow.customer.CustomerRepository;
import com.sanni.retailflow.inventory.InventoryMovement;
import com.sanni.retailflow.inventory.InventoryMovementRepository;
import com.sanni.retailflow.product.Product;
import com.sanni.retailflow.product.ProductRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerOrderRepository orderRepository;

    @Mock
    private OrderItemRepository itemRepository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @InjectMocks
    private OrderService service;

    private Customer createCustomer() {
        return new Customer(
            "John Customer",
            "john.customer@example.com",
            "08012345678",
            "Ikeja, Lagos"
        );
    }

    private Product createProduct(int stock) {
        Product product = new Product();
        product.setName("LG Smart TV");
        product.setSku("LG-TV-001");
        product.setPrice(new BigDecimal("550000.00"));
        product.setStockQuantity(stock);
        product.setCategory("Electronics");
        return product;
    }

    @Test
    void shouldCreateOrderAndDeductStock() {
        Customer customer = createCustomer();
        Product product = createProduct(10);

        when(customerRepository.findById(1L))
            .thenReturn(Optional.of(customer));

        when(productRepository.findByIdForUpdate(2L))
            .thenReturn(Optional.of(product));

        when(orderRepository.save(any(CustomerOrder.class)))
            .thenAnswer(invocation -> {
                CustomerOrder order = invocation.getArgument(0);
                return order;
            });

        when(productRepository.save(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(movementRepository.save(any(InventoryMovement.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        OrderRequest request = new OrderRequest(
            1L,
            List.of(new OrderItemRequest(2L, 2))
        );

        OrderResponse response = service.createOrder(request);

        assertNotNull(response);
        assertEquals(1, response.items().size());
        assertEquals(8, product.getStockQuantity());
        assertEquals(
            new BigDecimal("1100000.00"),
            response.totalAmount()
        );
        assertEquals(OrderStatus.PENDING, response.status());

        verify(productRepository).save(product);
        verify(movementRepository).save(any(InventoryMovement.class));
        verify(itemRepository).saveAll(anyList());
    }

    @Test
    void shouldRejectOrderWhenStockIsInsufficient() {
        Customer customer = createCustomer();
        Product product = createProduct(5);

        when(customerRepository.findById(1L))
            .thenReturn(Optional.of(customer));

        when(orderRepository.save(any(CustomerOrder.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(productRepository.findByIdForUpdate(2L))
            .thenReturn(Optional.of(product));

        OrderRequest request = new OrderRequest(
            1L,
            List.of(new OrderItemRequest(2L, 10))
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.createOrder(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(5, product.getStockQuantity());

        verify(productRepository, never()).save(any(Product.class));
        verify(movementRepository, never()).save(any(InventoryMovement.class));
    }

    @Test
    void shouldReturnNotFoundWhenCustomerDoesNotExist() {
        when(customerRepository.findById(999L))
            .thenReturn(Optional.empty());

        OrderRequest request = new OrderRequest(
            999L,
            List.of(new OrderItemRequest(2L, 1))
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.createOrder(request)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

        verify(orderRepository, never()).save(any(CustomerOrder.class));
    }

    @Test
    void shouldReturnNotFoundWhenProductDoesNotExist() {
        when(customerRepository.findById(1L))
            .thenReturn(Optional.of(createCustomer()));

        when(orderRepository.save(any(CustomerOrder.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(productRepository.findByIdForUpdate(999L))
            .thenReturn(Optional.empty());

        OrderRequest request = new OrderRequest(
            1L,
            List.of(new OrderItemRequest(999L, 1))
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.createOrder(request)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void shouldCancelOrderAndRestoreStock() {
        Customer customer = createCustomer();
        Product product = createProduct(8);
	ReflectionTestUtils.setField(product, "id", 2L);

        CustomerOrder order = new CustomerOrder(customer);
        OrderItem item = new OrderItem(
            order,
            product,
            2,
            new BigDecimal("550000.00")
        );

        when(orderRepository.findById(1L))
            .thenReturn(Optional.of(order));

        when(itemRepository.findByOrderId(1L))
            .thenReturn(List.of(item));

        when(productRepository.findByIdForUpdate(2L))
            .thenReturn(Optional.of(product));

        when(productRepository.save(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(movementRepository.save(any(InventoryMovement.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        when(orderRepository.save(any(CustomerOrder.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = service.updateOrderStatus(
            1L,
            new OrderStatusRequest(OrderStatus.CANCELLED)
        );

        assertEquals(OrderStatus.CANCELLED, response.status());
        assertEquals(10, product.getStockQuantity());

        verify(productRepository).save(product);
        verify(movementRepository).save(any(InventoryMovement.class));
        verify(orderRepository).save(order);
    }
}
