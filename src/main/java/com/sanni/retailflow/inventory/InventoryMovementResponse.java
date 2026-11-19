package com.sanni.retailflow.inventory;

import java.time.LocalDateTime;

public record InventoryMovementResponse(
    Long id,
    Long productId,
    String productName,
    MovementType movementType,
    Integer quantity,
    String reason,
    LocalDateTime createdAt
) {
    public static InventoryMovementResponse from(InventoryMovement movement) {
        return new InventoryMovementResponse(
            movement.getId(),
            movement.getProduct().getId(),
            movement.getProduct().getName(),
            movement.getMovementType(),
            movement.getQuantity(),
            movement.getReason(),
            movement.getCreatedAt()
        );
    }
}
