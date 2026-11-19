
package com.sanni.retailflow.product;

import com.sanni.retailflow.inventory.InventoryMovement;
import com.sanni.retailflow.inventory.InventoryMovementRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository repository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @InjectMocks
    private ProductService service;

    private ProductRequest validRequest() {
        return new ProductRequest(
            "Samsung Television",
            "SAMSUNG-TV-001",
            "Samsung Smart Television",
            new BigDecimal("850000.00"),
            10,
            "Electronics"
        );
    }

    @Test
    void shouldCreateProductSuccessfully() {
        when(repository.existsBySku("SAMSUNG-TV-001"))
            .thenReturn(false);

        when(repository.save(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        Product product = service.create(validRequest());

        assertNotNull(product);
        assertEquals("Samsung Television", product.getName());
        assertEquals("SAMSUNG-TV-001", product.getSku());
        assertEquals(10, product.getStockQuantity());

        verify(repository).save(any(Product.class));
        verify(movementRepository).save(any(InventoryMovement.class));
    }

    @Test
    void shouldRejectDuplicateSku() {
        when(repository.existsBySku("SAMSUNG-TV-001"))
            .thenReturn(true);

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.create(validRequest())
        );

        assertEquals(
            HttpStatus.CONFLICT,
            exception.getStatusCode()
        );

        verify(repository, never()).save(any(Product.class));
    }

    @Test
    void shouldRetrieveProductById() {
        Product product = new Product();
        product.setName("Samsung Television");
        product.setSku("SAMSUNG-TV-001");

        when(repository.findById(1L))
            .thenReturn(Optional.of(product));

        Product result = service.getById(1L);

        assertNotNull(result);
        assertEquals("Samsung Television", result.getName());
    }

    @Test
    void shouldReturnNotFoundForMissingProduct() {
        when(repository.findById(999L))
            .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.getById(999L)
        );

        assertEquals(
            HttpStatus.NOT_FOUND,
            exception.getStatusCode()
        );
    }
}
