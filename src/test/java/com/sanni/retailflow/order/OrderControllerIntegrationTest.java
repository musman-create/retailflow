
package com.sanni.retailflow.order;

import com.sanni.retailflow.customer.Customer;
import com.sanni.retailflow.customer.CustomerRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    private Customer createCustomer() {
    Customer customer = new Customer(
        "Order Integration Customer",
        "order.integration@example.com",
        "08055556666",
        "Ikeja, Lagos"
    );

    return customerRepository.saveAndFlush(customer);
}

    private Product createProduct(int stock) {
        Product product = new Product();
        product.setName("Order Integration Television");
        product.setSku("ORDER-TEST-TV-001");
        product.setDescription("Order integration test product");
        product.setPrice(new BigDecimal("250000.00"));
        product.setStockQuantity(stock);
        product.setCategory("Electronics");

        return productRepository.saveAndFlush(product);
    }

    private String orderJson(Long customerId, Long productId, int quantity) {
        return """
            {
                "customerId": %d,
                "items": [
                    {
                        "productId": %d,
                        "quantity": %d
                    }
                ]
            }
            """.formatted(customerId, productId, quantity);
    }

    private long createOrder(Customer customer, Product product)
            throws Exception {

        String response = mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderJson(
                    customer.getId(), product.getId(), 2
                )))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        return new tools.jackson.databind.ObjectMapper()
            .readTree(response)
            .get("orderId")
            .asLong();
    }

    @Test
    void shouldCreateOrderAndDeductStock() throws Exception {
        Customer customer = createCustomer();
        Product product = createProduct(10);

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderJson(
                    customer.getId(), product.getId(), 2
                )))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PENDING"));

        Product updated = productRepository.findById(product.getId())
            .orElseThrow();

        assertEquals(8, updated.getStockQuantity());
    }

    @Test
    void shouldRetrieveOrderById() throws Exception {
        Customer customer = createCustomer();
        Product product = createProduct(10);

        long orderId = createOrder(customer, product);

        mockMvc.perform(get("/api/orders/" + orderId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.orderId").value(orderId))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void shouldRetrieveCustomerOrderHistory() throws Exception {
        Customer customer = createCustomer();
        Product product = createProduct(10);

        createOrder(customer, product);

        mockMvc.perform(get("/api/orders/customer/"
                + customer.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void shouldUpdateOrderStatus() throws Exception {
        Customer customer = createCustomer();
        Product product = createProduct(10);

        long orderId = createOrder(customer, product);

        String statusRequest = """
            {
                "status": "PROCESSING"
            }
            """;

        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(statusRequest))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PROCESSING"));
    }

    @Test
    void shouldRejectOrderWhenStockIsInsufficient() throws Exception {
        Customer customer = createCustomer();
        Product product = createProduct(3);

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderJson(
                    customer.getId(), product.getId(), 5
                )))
            .andExpect(status().isConflict());

        Product unchanged = productRepository.findById(product.getId())
            .orElseThrow();

        assertEquals(3, unchanged.getStockQuantity());
    }
}
