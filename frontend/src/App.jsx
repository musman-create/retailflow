
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  RefreshCw,
  ArrowUpRight,
  Boxes,
  AlertTriangle,
  Menu,
  X,
  Clock3,
  CheckCircle2,
  CircleDollarSign,
} from 'lucide-react'
import './App.css'

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activePage, setActivePage] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

const [showAddProduct, setShowAddProduct] = useState(false)
const [editingProductId, setEditingProductId] = useState(null)
const [saving, setSaving] = useState(false)
const [formError, setFormError] = useState('')
const [formSuccess, setFormSuccess] = useState('')

const [productForm, setProductForm] = useState({
  name: '',
  sku: '',
  description: '',
  price: '',
  stockQuantity: '',
  category: '',
})

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products')

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`)
      }

      const data = await response.json()
      setProducts(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message || 'Could not load products')
    } finally {
      setLoading(false)
    }
  }, [])

  function handleEditProduct(product) {
    setEditingProductId(product.id)

    setProductForm({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stockQuantity: String(product.stockQuantity ?? ''),
      category: product.category || '',
    })

    setFormError('')
    setFormSuccess('')
    setShowAddProduct(true)
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to archive ${product.name}? It will be hidden from active products, but its history will be preserved.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(
          result?.message || result?.error || 'Could not archive product.'
        )
      }

      setFormSuccess(`${product.name} archived successfully!`)
      await loadProducts()
    } catch (err) {
      window.alert(err.message || 'Something went wrong while archiving.')
    }
  }

  async function handleAddProduct(event) {
    event.preventDefault()

    setFormError('')
    setFormSuccess('')

    const price = Number(productForm.price)
    const stockQuantity = Number(productForm.stockQuantity)

    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Price must be greater than zero.')
      return
    }

    if (
      productForm.stockQuantity.trim() === '' ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setFormError('Enter a valid stock quantity of zero or greater.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        editingProductId
          ? `/api/products/${editingProductId}`
          : '/api/products',
        {
          method: editingProductId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...productForm,
            price,
            stockQuantity,
          }),
        }
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || 'Could not create product.'
        )
      }

      setFormSuccess(
        editingProductId
          ? 'Product updated successfully!'
          : 'Product added successfully!'
      )

      setProductForm({
        name: '',
        sku: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
      })

      setEditingProductId(null)
      setShowAddProduct(false)
      await loadProducts()
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    fetch('/api/products')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : [])
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load products')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim()

    if (!term) return products

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.category,
        product.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [products, search])

  const totalUnits = products.reduce(
    (total, product) => total + (Number(product.stockQuantity) || 0),
    0
  )

  const lowStockProducts = products.filter(
    (product) => Number(product.stockQuantity) <= 5
  )

  const inventoryValue = products.reduce(
    (total, product) =>
      total +
      (Number(product.price) || 0) *
        (Number(product.stockQuantity) || 0),
    0
  )

  const navigation = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Products', icon: Package },
    { label: 'Orders', icon: ShoppingCart },
    { label: 'Customers', icon: Users },
    { label: 'Reports', icon: BarChart3 },
  ]

  function navigate(page) {
    setActivePage(page)
    setMobileMenuOpen(false)
  }

  const pageDescriptions = {
    Dashboard: 'Here is what is happening in your store today.',
    Products: 'Manage your products, prices and stock levels.',
    Orders: 'Track and manage customer orders.',
    Customers: 'View and manage your customer records.',
    Reports: 'Your store performance reports will appear here.',
  }

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Boxes size={24} />
          </div>
          <div>
            <h1>RetailFlow</h1>
            <span>RETAIL MANAGEMENT</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="main-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? 'active' : ''}`}
              onClick={() => navigate(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === 'Products' && products.length > 0 && (
                <span className="nav-count">{products.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleDollarSign size={20} />
            </div>
            <h3>Keep your store moving</h3>
            <p>Monitor stock and manage your business from one place.</p>
          </div>

          <button
            className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`}
            onClick={() => navigate('Settings')}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">RF</div>
            <div className="profile-info">
              <strong>Store Admin</strong>
              <span>Administrator</span>
            </div>
            <span className="profile-menu">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <span className="status-dot" />
              System online
            </div>
            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
            <div className="top-avatar">RF</div>
          </div>
        </header>

        <div className="page-container">
          <section className="page-heading">
  <div>
    <div className="eyebrow">RETAILFLOW WORKSPACE</div>
    <h2>{activePage}</h2>
    <p>{pageDescriptions[activePage] || 'Manage your store settings.'}</p>
  </div>

  <div className="heading-actions">
{formSuccess && !showAddProduct && (
  <div className="success-banner">
    {formSuccess}
    <button
      type="button"
      onClick={() => setFormSuccess('')}
    >
      ×
    </button>
  </div>
)}
    {(activePage === 'Dashboard' || activePage === 'Products') && (
      <button
        className="primary-button"
        onClick={() => {
          setFormError('')
          setFormSuccess('')
          setShowAddProduct(true)
          setActivePage('Products')
        }}
      >
        + Add Product
      </button>
    )}

    <button
      className="refresh-button"
      onClick={loadProducts}
      disabled={loading}
    >
      <RefreshCw size={16} className={loading ? 'spin' : ''} />
      Refresh data
    </button>
  </div>
</section>

{showAddProduct && (
  <div className="modal-backdrop">
    <div className="product-modal">
      <div className="modal-header">
        <div>
          <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
          <p>Enter the details of your new inventory item.</p>
        </div>
        <button
          type="button"
          className="close-button"
          onClick={() => setShowAddProduct(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleAddProduct}>
        <div className="form-grid">
          <label className="form-field">
            Product Name *
            <input
              name="name"
              value={productForm.name}
              onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              maxLength={150}
              placeholder="e.g. Samsung Smart TV"
            />
          </label>

          <label className="form-field">
            SKU *
            <input
              name="sku"
              value={productForm.sku}
              onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
              required
              maxLength={50}
              placeholder="e.g. SAM-TV-001"
            />
          </label>

          <label className="form-field">
            Category *
            <input
              name="category"
              value={productForm.category}
              onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
              required
              maxLength={100}
              placeholder="e.g. Electronics"
            />
          </label>

          <label className="form-field">
            Price (₦) *
            <input
              type="number"
              name="price"
              value={productForm.price}
              onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
              min="0.01"
              step="0.01"
              required
              placeholder="e.g. 150000"
            />
          </label>

          <label className="form-field">
            Stock Quantity *
            <input
              type="number"
              name="stockQuantity"
              value={productForm.stockQuantity}
              onChange={(e) => setProductForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
              min="0"
              step="1"
              required
              placeholder="e.g. 20"
            />
          </label>

          <label className="form-field full-width">
            Description
            <textarea
              name="description"
              value={productForm.description}
              onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
              maxLength={1000}
              rows={3}
              placeholder="Describe the product..."
            />
          </label>
        </div>

        {formError && (
          <div className="form-error">{formError}</div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => setShowAddProduct(false)}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : editingProductId ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
          {activePage === 'Dashboard' || activePage === 'Products' ? (
            <>
              {activePage === 'Dashboard' && (
                <>
                  <section className="welcome-banner">
                    <div className="welcome-copy">
                      <span className="welcome-tag">YOUR BUSINESS AT A GLANCE</span>
                      <h3>Welcome to RetailFlow 👋</h3>
                      <p>
                        Keep track of your products, stock and daily store
                        operations from one dashboard.
                      </p>
                    </div>
                    <div className="welcome-art">
                      <div className="art-circle art-circle-one" />
                      <div className="art-circle art-circle-two" />
                      <Boxes size={86} strokeWidth={1.2} />
                    </div>
                  </section>

                  <section className="stats-grid">
                    <article className="stat-card">
                      <div className="stat-top">
                        <span className="stat-icon blue">
                          <Package size={20} />
                        </span>
                        <span className="stat-caption">IN YOUR CATALOGUE</span>
                      </div>
                      <div className="stat-value">
                        {loading ? '—' : products.length}
                      </div>
                      <div className="stat-footer">Total products</div>
                    </article>

                    <article className="stat-card">
                      <div className="stat-top">
                        <span className="stat-icon purple">
                          <Boxes size={20} />
                        </span>
                        <span className="stat-caption">AVAILABLE INVENTORY</span>
                      </div>
                      <div className="stat-value">
                        {loading ? '—' : totalUnits.toLocaleString('en-NG')}
                      </div>
                      <div className="stat-footer">Units in stock</div>
                    </article>

                    <article className="stat-card">
                      <div className="stat-top">
                        <span className="stat-icon orange">
                          <AlertTriangle size={20} />
                        </span>
                        <span className="stat-caption">NEEDS ATTENTION</span>
                      </div>
                      <div className="stat-value">
                        {loading ? '—' : lowStockProducts.length}
                      </div>
                      <div className="stat-footer">Low-stock products (5 or fewer)</div>
                    </article>

                    <article className="stat-card">
                      <div className="stat-top">
                        <span className="stat-icon green">
                          <CircleDollarSign size={20} />
                        </span>
                        <span className="stat-caption">CURRENT STOCK VALUE</span>
                      </div>
                      <div className="stat-value money-value">
                        {loading ? '—' : currency.format(inventoryValue)}
                      </div>
                      <div className="stat-footer">Based on current product prices</div>
                    </article>
                  </section>
                </>
              )}

              {error && (
                <div className="error-banner">
                  <AlertTriangle size={19} />
                  <div>
                    <strong>Unable to load products</strong>
                    <p>{error}. Check that your Spring Boot backend is running.</p>
                  </div>
                  <button onClick={loadProducts}>Try again</button>
                </div>
              )}

              <section className="content-card">
                <div className="card-heading">
                  <div>
                    <h3>{activePage === 'Dashboard' ? 'Product inventory' : 'All products'}</h3>
                    <p>Live information from your RetailFlow database</p>
                  </div>
                  <div className="product-total">
                    <span className="total-dot" />
                    {products.length} {products.length === 1 ? 'product' : 'products'}
                  </div>
                </div>

                <div className="table-toolbar">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="search"
                      placeholder="Search products, SKU or category..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <button className="filter-button" onClick={() => setSearch('')}>
                    Clear search
                  </button>
                </div>

                <div className="table-wrap">
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>SKU</th>
                        <th>CATEGORY</th>
                        <th>PRICE</th>
                        <th>STOCK</th>
                        <th>STATUS</th>
			<th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
  {loading ? (
    <tr>
      <td colSpan="7" className="table-message">
        Loading products...
      </td>
    </tr>
  ) : error ? (
    <tr>
      <td colSpan="7" className="table-message">
        Product information is currently unavailable.
      </td>
    </tr>
  ) : filteredProducts.length === 0 ? (
    <tr>
      <td colSpan="7" className="table-message">
        {search
          ? 'No products match your search.'
          : 'No products have been added yet.'}
      </td>
    </tr>
  ) : (
    filteredProducts.map((product) => {

                          const stock = Number(product.stockQuantity) || 0
                          const status =
                            stock === 0
                              ? 'Out of stock'
                              : stock <= 5
                                ? 'Low stock'
                                : 'In stock'

                          return (
                            <tr key={product.id}>
                              <td>
                                <div className="product-name-cell">
                                  <div className="product-thumb">
                                    <Package size={21} />
                                  </div>
                                  <div>
                                    <strong>{product.name}</strong>
                                    <span>
                                      {product.description || 'Retail product'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="sku-cell">{product.sku}</td>
                              <td>
                                <span className="category-pill">
                                  {product.category || 'Uncategorised'}
                                </span>
                              </td>
                              <td className="price-cell">
                                {currency.format(Number(product.price) || 0)}
                              </td>
                              <td className="stock-cell">{stock}</td>
                              <td>
                                <span
                                  className={`status-pill ${
                                    stock === 0
                                      ? 'status-out'
                                      : stock <= 5
                                        ? 'status-low'
                                        : 'status-good'
                                  }`}
                                >
                                  {stock === 0 ? (
                                    <AlertTriangle size={13} />
                                  ) : stock <= 5 ? (
                                    <Clock3 size={13} />
                                  ) : (
                                    <CheckCircle2 size={13} />
                                  )}

                                                                   {status}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="edit-button"
                                    onClick={() => handleEditProduct(product)}
                                  >
                                    Edit
                                  </button>
                                    <button
                                      type="button"
                                      className="delete-button"
                                      onClick={() => handleDeleteProduct(product)}
                                    >
                                      Archive
                                    </button>
                                </td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                  <span className="live-label">
                    <span className="status-dot" />
                    Live database data
                  </span>
                </div>
              </section>

              {activePage === 'Dashboard' && (
                <section className="bottom-grid">
                  <article className="content-card insight-card">
                    <div className="small-card-heading">
                      <div>
                        <h3>Inventory health</h3>
                        <p>Stock availability across your catalogue</p>
                      </div>
                      <ArrowUpRight size={19} />
                    </div>
                    <div className="inventory-summary">
                      <div className="inventory-number">
                        {loading ? '—' : totalUnits.toLocaleString('en-NG')}
                      </div>
                      <span>Total units recorded</span>
                    </div>
                    <div className="inventory-bar">
                      <div
                        className="inventory-bar-fill"
                        style={{
                          width: totalUnits > 0
                            ? `${Math.max(4, (products.filter(p => Number(p.stockQuantity) > 5).length / Math.max(products.length, 1)) * 100)}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <div className="inventory-legend">
                      <span><i className="legend-blue" /> Healthy stock</span>
                      <span><i className="legend-orange" /> Low or out of stock</span>
                    </div>
                  </article>

                  <article className="content-card attention-card">
                    <div className="small-card-heading">
                      <div>
                        <h3>Stock alerts</h3>
                        <p>Products that may need replenishment</p>
                      </div>
                      <AlertTriangle size={19} />
                    </div>
                    {loading ? (
                      <p className="empty-note">Checking inventory...</p>
                    ) : lowStockProducts.length === 0 ? (
                      <div className="all-clear">
                        <CheckCircle2 size={23} />
                        <span>No low-stock products right now.</span>
                      </div>
                    ) : (
                      <div className="alert-list">
                        {lowStockProducts.slice(0, 4).map((product) => (
                          <div className="alert-item" key={product.id}>
                            <div className="alert-product-icon">
                              <Package size={17} />
                            </div>
                            <div className="alert-product-name">
                              <strong>{product.name}</strong>
                              <span>{product.sku}</span>
                            </div>
                            <span className="alert-stock">
                              {product.stockQuantity} left
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </section>
              )}
            </>
          ) : (
            <section className="content-card coming-soon">
              <div className="coming-icon">
                {activePage === 'Orders' ? (
                  <ShoppingCart size={30} />
                ) : activePage === 'Customers' ? (
                  <Users size={30} />
                ) : activePage === 'Reports' ? (
                  <BarChart3 size={30} />
                ) : (
                  <Settings size={30} />
                )}
              </div>
              <h3>{activePage} workspace</h3>
              <p>
                This section is coming next. Your dashboard and live product
                inventory are already connected to the backend.
              </p>
              <button
                className="primary-button"
                onClick={() => navigate('Dashboard')}
              >
                Back to dashboard
              </button>
            </section>
          )}

          <footer className="page-footer">
            <span>© 2026 RetailFlow. Store management made simpler.</span>
            <span>Built with React & Spring Boot</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
