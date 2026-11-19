
package com.sanni.retailflow.customer;

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
class CustomerServiceTest {

    @Mock
    private CustomerRepository repository;

    @InjectMocks
    private CustomerService service;

    private CustomerRequest validRequest() {
        return new CustomerRequest(
            "John Customer",
            "john.customer@example.com",
            "08012345678",
            "Ikeja, Lagos"
        );
    }

    @Test
    void shouldCreateCustomerSuccessfully() {
        when(repository.existsByEmail("john.customer@example.com"))
            .thenReturn(false);

        when(repository.existsByPhone("08012345678"))
            .thenReturn(false);

        when(repository.save(any(Customer.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        Customer customer = service.create(validRequest());

        assertNotNull(customer);
        assertEquals("John Customer", customer.getFullName());
        assertEquals("john.customer@example.com", customer.getEmail());
        assertEquals("08012345678", customer.getPhone());

        verify(repository).save(any(Customer.class));
    }

    @Test
    void shouldRejectDuplicateEmail() {
        when(repository.existsByEmail("john.customer@example.com"))
            .thenReturn(true);

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.create(validRequest())
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());

        verify(repository, never()).save(any(Customer.class));
    }

    @Test
    void shouldRejectDuplicatePhone() {
        when(repository.existsByEmail("john.customer@example.com"))
            .thenReturn(false);

        when(repository.existsByPhone("08012345678"))
            .thenReturn(true);

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.create(validRequest())
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());

        verify(repository, never()).save(any(Customer.class));
    }

    @Test
    void shouldRetrieveCustomerById() {
        Customer customer = new Customer(
            "John Customer",
            "john.customer@example.com",
            "08012345678",
            "Ikeja, Lagos"
        );

        when(repository.findById(1L))
            .thenReturn(Optional.of(customer));

        Customer result = service.getById(1L);

        assertNotNull(result);
        assertEquals("John Customer", result.getFullName());
    }

    @Test
    void shouldReturnNotFoundForMissingCustomer() {
        when(repository.findById(999L))
            .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> service.getById(999L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }
}
