
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

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')

  const [editingCustomerId, setEditingCustomerId] = useState(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [customerFormError, setCustomerFormError] = useState('')
  const [customerForm, setCustomerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  })


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

  async function handleAddCustomer(event) {
    event.preventDefault()

    setCustomerFormError('')
    setSavingCustomer(true)

    const isEditing = editingCustomerId !== null

    try {
      const response = await fetch(
        isEditing
          ? `/api/customers/${editingCustomerId}`
          : '/api/customers',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: customerForm.fullName.trim(),
            email: customerForm.email.trim(),
            phone: customerForm.phone.trim(),
            address: customerForm.address.trim(),
          }),
        }
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          (isEditing ? 'Could not update customer.' : 'Could not register customer.')
        )
      }

      setCustomerForm({
        fullName: '',
        email: '',
        phone: '',
        address: '',
      })

      setEditingCustomerId(null)
      setShowAddCustomer(false)
      await loadCustomers()
    } catch (err) {
      setCustomerFormError(err.message || 'Something went wrong.')
    } finally {
      setSavingCustomer(false)
    }
  }

  function handleEditCustomer(customer) {
    setCustomerFormError('')
    setEditingCustomerId(customer.id)

    setCustomerForm({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    })

    setShowAddCustomer(true)
  }

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)

    try {
      const response = await fetch('/api/orders')

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`)
      }

      const data = await response.json()
      setOrders(Array.isArray(data) ? data : [])
      setOrdersError('')
    } catch (err) {
      setOrdersError(err.message || 'Could not load orders')
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  async function handleUpdateOrderStatus(order, newStatus) {
    if (!order || !newStatus || newStatus === order.status) return

    if (newStatus === 'CANCELLED') {
      const confirmed = window.confirm(
        `Cancel order #${order.orderId}? The quantities ordered will be returned to inventory.`
      )

      if (!confirmed) return
    }

    setUpdatingOrderId(order.orderId)
    setOrdersError('')

    try {
      const response = await fetch(`/api/orders/${order.orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(
          result?.message ||
          result?.detail ||
          result?.error ||
          `Could not update order status (HTTP ${response.status})`
        )
      }

      await loadOrders()

      if (newStatus === 'CANCELLED') {
        await loadProducts()
      }

      if (selectedOrder?.orderId === order.orderId) {
        const updatedOrder = await response.json().catch(() => null)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
    } catch (err) {
      setOrdersError(err.message || 'Could not update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true)

    try {
      const response = await fetch('/api/customers')

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`)
      }

      const data = await response.json()
      setCustomers(Array.isArray(data) ? data : [])
      setCustomersError('')
    } catch (err) {
      setCustomersError(err.message || 'Could not load customers')
    } finally {
      setCustomersLoading(false)
    }
  }, [])

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

  useEffect(() => {
    if (activePage === 'Orders') {
      loadOrders()
    }

    if (activePage === 'Customers') {
      loadCustomers()
    }
  }, [activePage, loadOrders, loadCustomers])

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

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        String(order.orderId).toLowerCase().includes(term) ||
        String(order.customerName || '').toLowerCase().includes(term)

      const matchesStatus =
        orderStatusFilter === 'ALL' ||
        order.status === orderStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, orderSearch, orderStatusFilter])

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase()

    if (!term) return customers

    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.email,
        customer.phone,
        customer.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [customers, customerSearch])

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
      onClick={
        activePage === 'Customers'
          ? loadCustomers
          : activePage === 'Orders'
            ? loadOrders
            : loadProducts
      }
      disabled={
        activePage === 'Customers'
          ? customersLoading
          : activePage === 'Orders'
            ? ordersLoading
            : loading
      }
    >
      <RefreshCw
        size={16}
        className={
          (activePage === 'Customers'
            ? customersLoading
            : activePage === 'Orders'
              ? ordersLoading
              : loading)
            ? 'spin'
            : ''
        }
      />
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
{showAddCustomer && (
  <div className="modal-backdrop">
    <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
      <div className="modal-header">
        <div>
          <h3 id="customer-modal-title">{editingCustomerId ? "Edit Customer" : "Register New Customer"}</h3>
          <p>{editingCustomerId ? "Update the customer contact information." : "Enter the customer contact information."}</p>
        </div>
        <button
          type="button"
          className="close-button"
          onClick={() => {
            setEditingCustomerId(null)
            setShowAddCustomer(false)
          }}
          aria-label="Close customer form"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleAddCustomer}>
        <div className="form-grid">
          <label className="form-field full-width">
            Full Name *
            <input
              type="text"
              name="fullName"
              value={customerForm.fullName}
              onChange={(event) =>
                setCustomerForm((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
              required
              maxLength={120}
              placeholder="e.g. John Customer"
            />
          </label>

          <label className="form-field">
            Email Address *
            <input
              type="email"
              name="email"
              value={customerForm.email}
              onChange={(event) =>
                setCustomerForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              required
              maxLength={150}
              placeholder="e.g. john@example.com"
            />
          </label>

          <label className="form-field">
            Phone Number *
            <input
              type="tel"
              name="phone"
              value={customerForm.phone}
              onChange={(event) =>
                setCustomerForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              required
              maxLength={20}
              placeholder="e.g. 08012345678"
            />
          </label>

          <label className="form-field full-width">
            Address
            <textarea
              name="address"
              value={customerForm.address}
              onChange={(event) =>
                setCustomerForm((prev) => ({
                  ...prev,
                  address: event.target.value,
                }))
              }
              maxLength={255}
              rows={3}
              placeholder="Customer's address"
            />
          </label>
        </div>

        {customerFormError && (
          <div className="form-error">{customerFormError}</div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => {
            setEditingCustomerId(null)
            setShowAddCustomer(false)
          }}
            disabled={savingCustomer}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={savingCustomer}
          >
            {savingCustomer ? 'Saving...' : editingCustomerId ? 'Update Customer' : 'Register Customer'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{selectedOrder && (
  <div className="modal-backdrop">
    <div className="product-modal order-details-modal" role="dialog" aria-modal="true" aria-labelledby="order-details-title">
      <div className="modal-header">
        <div>
          <h3 id="order-details-title">Order #{selectedOrder.orderId}</h3>
          <p>Full details of this customer order</p>
        </div>
        <button
          type="button"
          className="close-button"
          onClick={() => setSelectedOrder(null)}
          aria-label="Close order details"
        >
          ×
        </button>
      </div>

      <div className="order-details-summary">
        <div>
          <span>Customer</span>
          <strong>{selectedOrder.customerName || 'Unknown customer'}</strong>
        </div>
        <div>
          <span>Customer ID</span>
          <strong>{selectedOrder.customerId ?? '—'}</strong>
        </div>
        <div>
          <span>Order date</span>
          <strong>
            {selectedOrder.createdAt
              ? new Date(selectedOrder.createdAt).toLocaleString('en-NG', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })
              : '—'}
          </strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <span className={`status-pill order-status status-${String(selectedOrder.status || '').toLowerCase()}`}>
              {selectedOrder.status || 'UNKNOWN'}
            </span>
          </strong>
        </div>
      </div>

      <h4 className="order-items-heading">Items in this order</h4>
      <div className="table-wrap">
        <table className="product-table">
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>QUANTITY</th>
              <th>UNIT PRICE</th>
              <th>SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
              selectedOrder.items.map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td><strong>{item.productName || 'Unknown product'}</strong></td>
                  <td>{item.quantity}</td>
                  <td>{currency.format(Number(item.unitPrice) || 0)}</td>
                  <td className="price-cell">
                    {currency.format(Number(item.subtotal) || 0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No order items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="order-details-total">
        <span>Order total</span>
        <strong>{currency.format(Number(selectedOrder.totalAmount) || 0)}</strong>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => setSelectedOrder(null)}
        >
          Close
        </button>
      </div>
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
          ) : activePage === 'Orders' ? (
            <section className="content-card">
              <div className="card-heading">
                <div>
                  <h3>All customer orders</h3>
                  <p>Live order information from your RetailFlow database</p>
                </div>
                <div className="product-total">
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </div>
              </div>

              <div className="table-toolbar">
                <div className="search-box">
                  <Search />
                  <input
                    type="search"
                    placeholder="Search by order ID or customer..."
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                  />
                </div>

                <select
                  className="filter-button"
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {ordersError && (
                <div className="error-banner">{ordersError}</div>
              )}

              <div className="table-wrap">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>ORDER ID</th>
                      <th>CUSTOMER</th>
                      <th>DATE</th>
                      <th>ITEMS</th>
                      <th>TOTAL AMOUNT</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr>
                        <td colSpan="7" className="table-message">
                          Loading orders...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="table-message">
                          {orders.length === 0
                            ? 'No orders have been recorded yet.'
                            : 'No orders match your search or status filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.orderId}>
                          <td className="sku-cell">#{order.orderId}</td>
                          <td>
                            <strong>{order.customerName || 'Unknown customer'}</strong>
                          </td>
                          <td>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString('en-NG', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </td>
                          <td>{Array.isArray(order.items) ? order.items.length : 0}</td>
                          <td className="price-cell">
                            {currency.format(Number(order.totalAmount) || 0)}
                          </td>
                          <td>
                            <span className={`status-pill order-status status-${String(order.status || '').toLowerCase()}`}>
                              {order.status || 'UNKNOWN'}
                            </span>
                          </td>
                          <td>
                            <select
                              className="filter-button"
                              aria-label={`Update status for order ${order.orderId}`}
                              value={order.status || 'PENDING'}
                              disabled={
                                updatingOrderId === order.orderId ||
                                order.status === 'DELIVERED' ||
                                order.status === 'CANCELLED'
                              }
                              onChange={(event) =>
                                handleUpdateOrderStatus(order, event.target.value)
                              }
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>

                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
                <span className="live-label">
                  <span className="status-dot" />
                  Live database data
                </span>
              </div>
            </section>
          ) : activePage === 'Customers' ? (
            <section className="content-card">
              <div className="table-header">
                <div>
                  <h3>Customer directory</h3>
                  <p>Manage your registered customers</p>
                </div>

                <div className="table-actions">
                  <div className="search-box">
                    <Search size={17} />
                    <input
                      type="search"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(event) => setCustomerSearch(event.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setEditingCustomerId(null)
                      setCustomerFormError('')
                      setCustomerForm({
                        fullName: '',
                        email: '',
                        phone: '',
                        address: '',
                      })
                      setShowAddCustomer(true)
                    }}
                  >
                    + Add Customer
                  </button>
                </div>
              </div>

              {customersError ? (
                <div className="empty-state">
                  <AlertTriangle size={24} />
                  <p>{customersError}</p>
                  <button className="primary-button" onClick={loadCustomers}>
                    Try again
                  </button>
                </div>
              ) : customersLoading ? (
                <div className="empty-state">
                  <p>Loading customers...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="empty-state">
                  <Users size={26} />
                  <h3>No customers yet</h3>
                  <p>Registered customers will appear here.</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="empty-state">
                  <Search size={24} />
                  <p>No customers match your search.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Date registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>#{customer.id}</td>
                          <td><strong>{customer.fullName}</strong></td>
                          <td>{customer.email}</td>
                          <td>{customer.phone}</td>
                          <td>{customer.address || '—'}</td>
                          <td>
                            {customer.createdAt
                              ? new Date(customer.createdAt).toLocaleDateString('en-NG', {
                                  dateStyle: 'medium',
                                })
                              : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="table-footer">
                <span>
                  Showing {filteredCustomers.length} of {customers.length} customers
                </span>
                <span className="live-label">
                  <span className="status-dot" />
                  Live database data
                </span>
              </div>
            </section>
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
