package com.sanni.retailflow.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockMovementRequest(

    @NotNull(message = "Movement type is required")
    MovementType movementType,

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity,

    @NotBlank(message = "Reason is required")
    @Size(max = 255)
    String reason

) {}
