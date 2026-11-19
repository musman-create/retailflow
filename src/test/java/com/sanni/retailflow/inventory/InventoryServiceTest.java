
package com.sanni.retailflow.inventory;

import com.sanni.retailflow.product.Product;
import com.sanni.retailflow.product.ProductRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @InjectMocks
    private InventoryService service;

    private Product createProduct(int stock) {
        Product product = new Product();
        product.setName("LG Smart TV");
        product.setSku("LG-TV-001");
        product.setStockQuantity(stock);
        return product;
    }

    @Test
    void shouldIncreaseStockSuccessfully() {
        Product product = createProduct(10);

        when(productRepository.findByIdForUpdate(1L))
            .thenReturn(Optional.of(product));

        when(productRepository.save(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        StockMovementRequest request = new StockMovementRequest(
            MovementType.IN,
            5,
            "New supplier delivery"
        );

        InventoryMovementResponse response =
            service.adjustStock(1L, request);

        assertNotNull(response);
        assertEquals(15, product.getStockQuantity());

        verify(productRepository).save(product);
        verify(movementRepository).save(any(InventoryMovement.class));
    }

    @Test
    void shouldDecreaseStockSuccessfully() {
        Product product = createProduct(10);

        when(productRepository.findByIdForUpdate(1L))
            .thenReturn(Optional.of(product));

        when(productRepository.save(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        StockMovementRequest request = new StockMovementRequest(
            MovementType.OUT,
            3,
            "Customer purchase"
        );

        InventoryMovementResponse response =
            service.adjustStock(1L, request);

        assertNotNull(response);
        assertEquals(7, product.getStockQuantity());

        verify(productRepository).save(product);
        verify(movementRepository).save(any(InventoryMovement.class));
    }

    @Test
    void shouldRejectStockDeductionWhenQuantityIsTooHigh() {
        Product product = createProduct(5);

        when(productRepository.findByIdForUpdate(1L))
            .thenReturn(Optional.of(product));

        StockMovementRequest request = new StockMovementRequest(
            MovementType.OUT,
            10,
            "Customer purchase"
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.adjustStock(1L, request)
        );

        assertEquals(
            HttpStatus.CONFLICT,
            exception.getStatusCode()
        );

        assertEquals(5, product.getStockQuantity());

        verify(productRepository, never()).save(any(Product.class));
        verify(movementRepository, never()).save(any(InventoryMovement.class));
    }

    @Test
    void shouldReturnNotFoundForMissingProduct() {
        when(productRepository.findByIdForUpdate(999L))
            .thenReturn(Optional.empty());

        StockMovementRequest request = new StockMovementRequest(
            MovementType.IN,
            5,
            "New supplier delivery"
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.adjustStock(999L, request)
        );

        assertEquals(
            HttpStatus.NOT_FOUND,
            exception.getStatusCode()
        );
    }
}
