
package com.sanni.retailflow.inventory;

import com.sanni.retailflow.product.Product;
import com.sanni.retailflow.product.ProductRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InventoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    private Product createProduct(int stock) {
        Product product = new Product();
        product.setName("Integration Test Product");
        product.setSku("INV-TEST-001");
        product.setDescription("Inventory integration test");
        product.setPrice(new BigDecimal("250000.00"));
        product.setStockQuantity(stock);
        product.setCategory("Electronics");

        return productRepository.saveAndFlush(product);
    }

    @Test
    void shouldAddStockSuccessfully() throws Exception {
        Product product = createProduct(10);

        String request = """
            {
                "movementType": "IN",
                "quantity": 5,
                "reason": "Integration test stock replenishment"
            }
            """;

        mockMvc.perform(post("/api/inventory/products/"
                + product.getId() + "/stock")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.movementType").value("IN"))
            .andExpect(jsonPath("$.quantity").value(5));

        Product updated = productRepository.findById(product.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(15, updated.getStockQuantity());
    }

    @Test
    void shouldRejectStockDeductionWhenQuantityIsTooHigh() throws Exception {
        Product product = createProduct(10);

        String request = """
            {
                "movementType": "OUT",
                "quantity": 15,
                "reason": "Integration test stock deduction"
            }
            """;

        mockMvc.perform(post("/api/inventory/products/"
                + product.getId() + "/stock")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isConflict());

        Product unchanged = productRepository.findById(product.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(10, unchanged.getStockQuantity());
    }

    @Test
    void shouldRetrieveStockMovementHistory() throws Exception {
        Product product = createProduct(10);

        String request = """
            {
                "movementType": "IN",
                "quantity": 4,
                "reason": "Supplier delivery"
            }
            """;

        mockMvc.perform(post("/api/inventory/products/"
                + product.getId() + "/stock")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/inventory/products/"
                + product.getId() + "/movements"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].movementType").value("IN"))
            .andExpect(jsonPath("$[0].quantity").value(4))
            .andExpect(jsonPath("$[0].reason").value("Supplier delivery"));
    }

    @Test
    void shouldRetrieveLowStockProducts() throws Exception {
        Product product = createProduct(3);

        mockMvc.perform(get("/api/inventory/low-stock")
                .param("threshold", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.id == "
                + product.getId() + ")]").isNotEmpty());
    }

    @Test
    void shouldRejectNegativeLowStockThreshold() throws Exception {
        mockMvc.perform(get("/api/inventory/low-stock")
                .param("threshold", "-1"))
            .andExpect(status().isBadRequest());
    }
}
