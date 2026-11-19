package com.sanni.retailflow.product;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductRequest(

    @NotBlank(message = "Product name is required")
    @Size(max = 150)
    String name,

    @NotBlank(message = "SKU is required")
    @Size(max = 50)
    String sku,

    @Size(max = 1000)
    String description,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", inclusive = false, message = "Price must be greater than zero")
    BigDecimal price,

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    Integer stockQuantity,

    @NotBlank(message = "Category is required")
    @Size(max = 100)
    String category

) {}
