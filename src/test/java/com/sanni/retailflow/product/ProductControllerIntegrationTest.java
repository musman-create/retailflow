
package com.sanni.retailflow.product;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProductControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String validProductJson() {
        return """
            {
                "name": "Integration Test Television",
                "sku": "TEST-TV-001",
                "description": "Test Samsung Smart Television",
                "price": 450000.00,
                "stockQuantity": 10,
                "category": "Electronics"
            }
            """;
    }

    @Test
    void shouldCreateProductSuccessfully() throws Exception {

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validProductJson()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name")
                .value("Integration Test Television"))
            .andExpect(jsonPath("$.sku")
                .value("TEST-TV-001"))
            .andExpect(jsonPath("$.stockQuantity")
                .value(10));
    }

    @Test
    void shouldRetrieveCreatedProductById() throws Exception {

        String response = mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validProductJson()))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode product = objectMapper.readTree(response);
        long productId = product.get("id").asLong();

        mockMvc.perform(get("/api/products/" + productId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(productId))
            .andExpect(jsonPath("$.sku")
                .value("TEST-TV-001"));
    }

    @Test
    void shouldRejectInvalidProductData() throws Exception {

        String invalidJson = """
            {
                "name": "",
                "sku": "",
                "description": "Invalid product",
                "price": -100,
                "stockQuantity": -5,
                "category": ""
            }
            """;

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectDuplicateSku() throws Exception {

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validProductJson()))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validProductJson()))
            .andExpect(status().isConflict());
    }
}
