package com.sanni.retailflow.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(

    @NotBlank(message = "Customer name is required")
    @Size(max = 120)
    String fullName,

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 150)
    String email,

    @NotBlank(message = "Phone number is required")
    @Size(max = 20)
    String phone,

    @Size(max = 255)
    String address

) {}
