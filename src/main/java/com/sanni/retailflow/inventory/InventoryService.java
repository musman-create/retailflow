package com.sanni.retailflow.inventory;

import com.sanni.retailflow.product.Product;
import com.sanni.retailflow.product.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository movementRepository;

    public InventoryService(
        ProductRepository productRepository,
        InventoryMovementRepository movementRepository
    ) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public InventoryMovementResponse adjustStock(
        Long productId,
        StockMovementRequest request
    ) {
        Product product = productRepository.findByIdForUpdate(productId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Product not found"
            ));

        if (!product.isActive()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Cannot adjust stock for an archived product"
            );
        }

        int currentStock = product.getStockQuantity();
        int quantity = request.quantity();

        if (request.movementType() == MovementType.OUT
            && quantity > currentStock) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Insufficient stock. Available quantity: " + currentStock
            );
        }

        int newStock = request.movementType() == MovementType.IN
            ? currentStock + quantity
            : currentStock - quantity;

        product.setStockQuantity(newStock);
        productRepository.save(product);

        InventoryMovement movement = new InventoryMovement(
            product,
            request.movementType(),
            quantity,
            request.reason()
        );

        movementRepository.save(movement);

        return InventoryMovementResponse.from(movement);
    }

    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> getMovements(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Product not found"
            );
        }

        return movementRepository
            .findByProductIdOrderByCreatedAtDesc(productId)
            .stream()
            .map(InventoryMovementResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts(Integer threshold) {
        return productRepository.findByActiveTrueAndStockQuantityLessThanEqual(threshold);
    }
}
