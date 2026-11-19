
package com.sanni.retailflow.customer;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CustomerControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String validCustomerJson() {
        return """
            {
                "fullName": "Integration Test Customer",
                "email": "integration.customer@example.com",
                "phone": "08098765432",
                "address": "Ikeja, Lagos"
            }
            """;
    }

    @Test
    void shouldCreateCustomerSuccessfully() throws Exception {
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCustomerJson()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.fullName")
                .value("Integration Test Customer"))
            .andExpect(jsonPath("$.email")
                .value("integration.customer@example.com"));
    }

    @Test
    void shouldRetrieveCreatedCustomerById() throws Exception {
        String response = mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCustomerJson()))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode customer = objectMapper.readTree(response);
        long customerId = customer.get("id").asLong();

        mockMvc.perform(get("/api/customers/" + customerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(customerId))
            .andExpect(jsonPath("$.email")
                .value("integration.customer@example.com"));
    }

    @Test
    void shouldRetrieveAllCustomers() throws Exception {
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCustomerJson()))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/customers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.email == "
                + "'integration.customer@example.com')]").isNotEmpty());
    }

    @Test
    void shouldRejectDuplicateEmail() throws Exception {
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCustomerJson()))
            .andExpect(status().isCreated());

        String duplicateEmail = """
            {
                "fullName": "Another Customer",
                "email": "integration.customer@example.com",
                "phone": "08012345679",
                "address": "Lagos"
            }
            """;

        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(duplicateEmail))
            .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectDuplicatePhone() throws Exception {
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validCustomerJson()))
            .andExpect(status().isCreated());

        String duplicatePhone = """
            {
                "fullName": "Another Customer",
                "email": "another.customer@example.com",
                "phone": "08098765432",
                "address": "Lagos"
            }
            """;

        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(duplicatePhone))
            .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectInvalidEmail() throws Exception {
        String invalidCustomer = """
            {
                "fullName": "Invalid Customer",
                "email": "not-an-email",
                "phone": "08011112222",
                "address": "Lagos"
            }
            """;

        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidCustomer))
            .andExpect(status().isBadRequest());
    }
}
