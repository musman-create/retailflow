package com.sanni.retailflow.product;

import com.sanni.retailflow.inventory.InventoryMovement;
import com.sanni.retailflow.inventory.InventoryMovementRepository;
import com.sanni.retailflow.inventory.MovementType;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository repository;
    private final InventoryMovementRepository movementRepository;

    public ProductService(
        ProductRepository repository,
        InventoryMovementRepository movementRepository
    ) {
        this.repository = repository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public Product create(ProductRequest request) {
        if (repository.existsBySku(request.sku())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "A product with this SKU already exists"
            );
        }

        Product product = new Product();
        copyRequestToProduct(request, product);

        Product savedProduct = repository.save(product);

        if (savedProduct.getStockQuantity() > 0) {
            movementRepository.save(new InventoryMovement(
                savedProduct,
                MovementType.IN,
                savedProduct.getStockQuantity(),
                "Initial stock"
            ));
        }

        return savedProduct;
    }

    public List<Product> getAll() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public Product getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Product not found"
            ));
    }

    @Transactional
    public Product update(Long id, ProductRequest request) {
        Product product = getById(id);

        if (repository.existsBySkuAndIdNot(request.sku(), id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Another product already uses this SKU"
            );
        }

        copyRequestToProduct(request, product);
        return repository.save(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = getById(id);

        if (movementRepository.existsByProductId(id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This product has inventory history and cannot be deleted"
            );
        }

        repository.delete(product);
    }

    private void copyRequestToProduct(ProductRequest request, Product product) {
        product.setName(request.name());
        product.setSku(request.sku());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(request.category());
    }
}
