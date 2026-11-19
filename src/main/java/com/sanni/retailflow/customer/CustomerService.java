package com.sanni.retailflow.customer;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public Customer create(CustomerRequest request) {

        if (repository.existsByEmail(request.email())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "A customer with this email already exists"
            );
        }

        if (repository.existsByPhone(request.phone())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "A customer with this phone number already exists"
            );
        }

        Customer customer = new Customer(
            request.fullName(),
            request.email(),
            request.phone(),
            request.address()
        );

        return repository.save(customer);
    }

    public List<Customer> getAll() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public Customer getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Customer not found"
            ));
    }
}
