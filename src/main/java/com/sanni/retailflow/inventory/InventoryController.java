package com.sanni.retailflow.inventory;

import com.sanni.retailflow.product.Product;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @PostMapping("/products/{id}/stock")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryMovementResponse adjustStock(
        @PathVariable Long id,
        @Valid @RequestBody StockMovementRequest request
    ) {
        return service.adjustStock(id, request);
    }

    @GetMapping("/products/{id}/movements")
    public List<InventoryMovementResponse> getMovements(
        @PathVariable Long id
    ) {
        return service.getMovements(id);
    }

    @GetMapping("/low-stock")
    public List<Product> getLowStockProducts(
        @RequestParam(defaultValue = "5") Integer threshold
    ) {
        if (threshold < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Threshold cannot be negative"
            );
        }

        return service.getLowStockProducts(threshold);
    }
}
