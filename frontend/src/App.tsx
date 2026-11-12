import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  Store,
  Package,
  Plus,
  CheckCircle2,
  Truck,
  Search,
  UserCheck,
  LogOut,
  Trash2,
  Edit3,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  api,
  Order,
  OrderStatus,
  Product,
  Role,
  User,
  Vendor,
} from './api';

type ActiveTab = 'storefront' | 'vendors' | 'orders' | 'vendor-studio';

interface CartItem {
  product: Product;
  quantity: number;
}

const ORDER_FLOW_STEPS: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('storefront');

  // Auth state
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('mv_jwt_token')
  );
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('mv_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState<Role>('CUSTOMER');

  // Storefront & Vendor data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  // Shopping Bag & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(
    '1 Infinite Loop, Cupertino, CA 95014'
  );
  const [placingOrder, setPlacingOrder] = useState(false);

  // Orders & Tracking
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [trackOrderIdInput, setTrackOrderIdInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  // Vendor Studio state
  const [myVendor, setMyVendor] = useState<Vendor | null>(null);
  const [vendorOrders, setVendorOrders] = useState<Order[]>([]);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    email: '',
    contactNumber: '',
    description: '',
    location: '',
  });
  const [editingVendor, setEditingVendor] = useState(false);

  // Product Form in Vendor Studio
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    tagline: '',
    description: '',
    category: 'Audio',
    price: '299.00',
    stockQuantity: '15',
  });

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  const saveSession = (newToken: string, user: User) => {
    localStorage.setItem('mv_jwt_token', newToken);
    localStorage.setItem('mv_user', JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
  };

  const clearSession = () => {
    localStorage.removeItem('mv_jwt_token');
    localStorage.removeItem('mv_user');
    setToken(null);
    setCurrentUser(null);
    setMyVendor(null);
    setMyOrders([]);
    setVendorOrders([]);
    notify('Signed out of session.');
  };

  // Load Vendors & Products
  const loadCatalog = async (vendorFilterId: number | null = selectedVendorId) => {
    setLoadingCatalog(true);
    try {
      const [vendorList, productList] = await Promise.all([
        api.getVendors(),
        vendorFilterId
          ? api.getProductsByVendor(vendorFilterId)
          : api.getProducts(),
      ]);
      setVendors(vendorList);
      setProducts(productList);
    } catch (err: any) {
      notify(err.message || 'Could not load catalog');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog(selectedVendorId);
  }, [selectedVendorId]);

  // Load Customer Orders & Vendor Studio Data when authenticated
  const loadUserWorkspace = async () => {
    if (!token || !currentUser) return;
    try {
      const orders = await api.getMyOrders(token);
      setMyOrders(orders);
    } catch {
      // ignore if none
    }

    if (currentUser.role === 'VENDOR' || currentUser.role === 'ADMIN') {
      try {
        const v = await api.getMyVendor(token);
        setMyVendor(v);
        setVendorForm({
          name: v.name,
          email: v.email,
          contactNumber: v.contactNumber,
          description: v.description || '',
          location: v.location || '',
        });
        const vOrders = await api.getVendorOrders(v.vendorId, token);
        setVendorOrders(vOrders);
      } catch {
        setMyVendor(null);
        setVendorOrders([]);
      }
    } else {
      setMyVendor(null);
      setVendorOrders([]);
    }
  };

  useEffect(() => {
    loadUserWorkspace();
  }, [token, currentUser?.userId]);

  // Quick Demo Switcher
  const quickSwitchAccount = async (email: string, label: string) => {
    try {
      const res = await api.login(email, 'password123');
      saveSession(res.accessToken, res.user);
      notify(`Switched to ${label} (${res.user.role})`);
      if (res.user.role === 'VENDOR') {
        setActiveTab('vendor-studio');
      }
    } catch (err: any) {
      notify(`Demo login failed: ${err.message}`);
    }
  };

  // Handle Login / Register form submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const res = await api.login(authEmail, authPassword);
        saveSession(res.accessToken, res.user);
        notify(`Welcome back, ${res.user.name}.`);
      } else {
        const res = await api.register({
          name: authName,
          email: authEmail,
          password: authPassword,
          role: authRole,
        });
        saveSession(res.accessToken, res.user);
        notify(`Account created for ${res.user.name} (${res.user.role}).`);
        if (res.user.role === 'VENDOR') {
          setActiveTab('vendor-studio');
        }
      }
      setAuthModalOpen(false);
      setAuthPassword('');
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Filtered products
  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        selectedCategory !== 'All' &&
        p.category?.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.vendorName && p.vendorName.toLowerCase().includes(q)) ||
          (p.tagline && p.tagline.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const activeVendorSpotlight = useMemo(
    () => vendors.find((v) => v.vendorId === selectedVendorId) || null,
    [vendors, selectedVendorId]
  );

  // Shopping Bag helpers
  const addToBag = (product: Product) => {
    if (product.stockQuantity <= 0) {
      notify('This item is currently out of stock.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.productId === product.productId
      );
      if (existing) {
        if (existing.quantity + 1 > product.stockQuantity) {
          notify(`Only ${product.stockQuantity} units available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    notify(`Added "${product.name}" (${product.vendorName}) to your bag.`);
  };

  const updateBagQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty > item.product.stockQuantity) {
            notify(`Max available stock is ${item.product.stockQuantity}`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      ),
    [cart]
  );

  const cartVendorCount = useMemo(() => {
    const set = new Set(cart.map((i) => i.product.vendorId));
    return set.size;
  }, [cart]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setBagOpen(false);
      setAuthModalOpen(true);
      notify('Please sign in to place your multi-vendor order.');
      return;
    }
    if (cart.length === 0) return;

    setPlacingOrder(true);
    try {
      const order = await api.placeOrder(
        {
          shippingAddress,
          items: cart.map((i) => ({
            productId: i.product.productId,
            quantity: i.quantity,
          })),
        },
        token
      );
      setCart([]);
      setBagOpen(false);
      await loadCatalog(selectedVendorId);
      await loadUserWorkspace();
      setTrackedOrder(order);
      setActiveTab('orders');
      notify(
        `Order #${order.orderId} placed across ${cartVendorCount} vendor(s)!`
      );
    } catch (err: any) {
      notify(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Track specific Order by ID
  const handleTrackById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setAuthModalOpen(true);
      notify('Please sign in to track orders.');
      return;
    }
    const id = Number(trackOrderIdInput);
    if (!id) return;
    try {
      const order = await api.getOrderById(id, token);
      setTrackedOrder(order);
      notify(`Loaded Order #${order.orderId} (${order.orderStatus}).`);
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Vendor Registration / Update
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (myVendor) {
        const updated = await api.updateVendor(
          myVendor.vendorId,
          vendorForm,
          token
        );
        setMyVendor(updated);
        setEditingVendor(false);
        notify(`Updated vendor profile for "${updated.name}".`);
      } else {
        const created = await api.registerVendor(vendorForm, token);
        setMyVendor(created);
        notify(`Vendor store "${created.name}" registered (ID #${created.vendorId}).`);
      }
      await loadCatalog(selectedVendorId);
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Create or Update Product for Vendor
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !myVendor) return;
    try {
      const payload = {
        vendorId: myVendor.vendorId,
        name: productForm.name,
        tagline: productForm.tagline,
        description: productForm.description,
        category: productForm.category,
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
      };
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload, token);
        notify(`Updated product "${productForm.name}".`);
      } else {
        await api.createProduct(payload, token);
        notify(`Published "${productForm.name}" under ${myVendor.name}.`);
      }
      setEditingProductId(null);
      setProductForm({
        name: '',
        tagline: '',
        description: '',
        category: 'Audio',
        price: '299.00',
        stockQuantity: '15',
      });
      await loadCatalog(selectedVendorId);
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!token) return;
    try {
      await api.deleteProduct(productId, token);
      notify(`Removed product #${productId}.`);
      await loadCatalog(selectedVendorId);
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    status: OrderStatus
  ) => {
    if (!token) return;
    try {
      const updated = await api.updateOrderStatus(orderId, status, token);
      notify(`Order #${orderId} status updated to ${updated.orderStatus}.`);
      await loadUserWorkspace();
      await loadCatalog(selectedVendorId);
    } catch (err: any) {
      notify(err.message);
    }
  };

  const myVendorProducts = useMemo(() => {
    if (!myVendor) return [];
    return products.filter((p) => p.vendorId === myVendor.vendorId);
  }, [products, myVendor]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Top Apple-Style Editorial Header */}
      <header className="apple-nav">
        <div className="apple-nav-inner">
          <button
            className="brand-lockup"
            onClick={() => {
              setSelectedVendorId(null);
              setActiveTab('storefront');
            }}
          >
            <span className="brand-title font-bold-apple">Atelier.</span>
            <span className="brand-subtitle font-italic-apple">
              Multi-Vendor Edition
            </span>
          </button>

          <nav className="nav-links">
            <button
              className={`nav-tab ${activeTab === 'storefront' ? 'active' : ''}`}
              onClick={() => setActiveTab('storefront')}
            >
              Storefront
            </button>
            <button
              className={`nav-tab ${activeTab === 'vendors' ? 'active' : ''}`}
              onClick={() => setActiveTab('vendors')}
            >
              Vendors ({vendors.length})
            </button>
            <button
              className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Order Tracking
            </button>
            <button
              className={`nav-tab ${
                activeTab === 'vendor-studio' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('vendor-studio')}
            >
              Vendor Studio
            </button>
          </nav>

          <div className="nav-actions">
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-normal-apple" style={{ fontSize: '0.82rem' }}>
                  <strong className="font-bold-apple">{currentUser.name}</strong>{' '}
                  <em className="font-italic-apple" style={{ color: '#6e6e73' }}>
                    ({currentUser.role})
                  </em>
                </span>
                <button
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={clearSession}
                  title="Sign Out"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            ) : (
              <button
                className="btn-outline"
                onClick={() => {
                  setAuthMode('login');
                  setAuthModalOpen(true);
                }}
              >
                <UserCheck size={15} /> Sign In / Join
              </button>
            )}

            <button className="btn-primary" onClick={() => setBagOpen(true)}>
              <ShoppingBag size={15} />
              <span>Bag ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </header>

      {/* 1-Click Demo Persona & Architecture Bar */}
      <div className="persona-bar">
        <div className="persona-bar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={15} />
            <span className="font-bold-apple">JWT + Eureka + API Gateway:</span>
            <span className="font-italic-apple" style={{ color: '#6e6e73' }}>
              Switch active persona in one click to test multi-vendor flows
            </span>
          </div>

          <div className="persona-switcher">
            <button
              className={`persona-chip ${
                currentUser?.email === 'customer@atelier.com' ? 'active' : ''
              }`}
              onClick={() =>
                quickSwitchAccount('customer@atelier.com', 'Samson (Customer)')
              }
            >
              Customer: Samson
            </button>
            <button
              className={`persona-chip ${
                currentUser?.email === 'vendor1@atelier.com' ? 'active' : ''
              }`}
              onClick={() =>
                quickSwitchAccount(
                  'vendor1@atelier.com',
                  'Cupertino Audio Lab'
                )
              }
            >
              Vendor 1: Cupertino Audio Lab
            </button>
            <button
              className={`persona-chip ${
                currentUser?.email === 'vendor2@atelier.com' ? 'active' : ''
              }`}
              onClick={() =>
                quickSwitchAccount(
                  'vendor2@atelier.com',
                  'Studio Minimalist Co.'
                )
              }
            >
              Vendor 2: Studio Minimalist Co.
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-container">
        {/* ==================== TAB 1: STOREFRONT ==================== */}
        {activeTab === 'storefront' && (
          <>
            <section className="hero-section">
              <div>
                <p className="hero-eyebrow font-bold-apple">
                  MULTI-VENDOR SHOPPING SYSTEM
                </p>
                <h1 className="hero-headline">
                  <span className="font-bold-apple">
                    Independent flagship vendors.
                  </span>{' '}
                  <span className="font-italic-apple">
                    Unified in one effortless bag.
                  </span>
                </h1>
                <p className="hero-description font-normal-apple">
                  Browse hardware and design objects directly from verified
                  vendors. Every order coordinates real-time stock across{' '}
                  <strong className="font-bold-apple">Vendor Service</strong>,{' '}
                  <strong className="font-bold-apple">Product Service</strong>,
                  and <strong className="font-bold-apple">Order Service</strong>{' '}
                  through our{' '}
                  <em className="font-italic-apple">
                    Spring Cloud API Gateway
                  </em>
                  .
                </p>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-value font-bold-apple">
                    {vendors.length}
                  </span>
                  <span className="stat-label font-italic-apple">
                    Active Vendors
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-value font-bold-apple">
                    {products.length}
                  </span>
                  <span className="stat-label font-italic-apple">
                    Catalog Objects
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-value font-bold-apple">4</span>
                  <span className="stat-label font-italic-apple">
                    Microservices
                  </span>
                </div>
              </div>
            </section>

            {/* Filter by Vendor & Search */}
            <section className="filter-toolbar">
              <div className="vendor-pills-row">
                <span
                  className="font-bold-apple"
                  style={{ fontSize: '0.8rem', marginRight: '6px' }}
                >
                  Filter by Vendor:
                </span>
                <button
                  className={`pill-btn ${
                    selectedVendorId === null ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedVendorId(null)}
                >
                  All Vendors
                </button>
                {vendors.map((v) => (
                  <button
                    key={v.vendorId}
                    className={`pill-btn ${
                      selectedVendorId === v.vendorId ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedVendorId(v.vendorId)}
                  >
                    {v.name}{' '}
                    <em className="font-italic-apple" style={{ opacity: 0.75 }}>
                      ({v.location || `ID #${v.vendorId}`})
                    </em>
                  </button>
                ))}
              </div>

              <div className="search-category-row">
                <div className="vendor-pills-row">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`pill-btn ${
                        selectedCategory === cat ? 'selected' : ''
                      }`}
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6e6e73',
                      }}
                    />
                    <input
                      type="text"
                      className="search-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="Search products, vendors, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-outline"
                    onClick={() => loadCatalog(selectedVendorId)}
                    title="Refresh Catalog"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>
            </section>

            {/* Selected Vendor Spotlight Header */}
            {activeVendorSpotlight && (
              <div className="vendor-spotlight">
                <div>
                  <span
                    className="font-bold-apple"
                    style={{
                      fontSize: '0.74rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#6e6e73',
                    }}
                  >
                    VENDOR STOREFRONT • VENDOR_ID #{activeVendorSpotlight.vendorId}
                  </span>
                  <h2
                    className="font-bold-apple"
                    style={{ fontSize: '1.75rem', marginTop: '4px' }}
                  >
                    {activeVendorSpotlight.name}{' '}
                    <span
                      className="font-italic-apple"
                      style={{ fontWeight: 400, color: '#6e6e73' }}
                    >
                      — {activeVendorSpotlight.location}
                    </span>
                  </h2>
                  <p
                    className="font-normal-apple"
                    style={{ color: '#6e6e73', marginTop: '6px' }}
                  >
                    {activeVendorSpotlight.description}
                  </p>
                  <p
                    className="font-normal-apple"
                    style={{
                      fontSize: '0.82rem',
                      marginTop: '8px',
                      color: '#1d1d1f',
                    }}
                  >
                    <strong className="font-bold-apple">Email:</strong>{' '}
                    {activeVendorSpotlight.email} &nbsp;|&nbsp;{' '}
                    <strong className="font-bold-apple">Contact:</strong>{' '}
                    {activeVendorSpotlight.contactNumber}
                  </p>
                </div>
                <button
                  className="btn-outline"
                  onClick={() => setSelectedVendorId(null)}
                >
                  Show All Vendors
                </button>
              </div>
            )}

            {/* Product Grid */}
            {loadingCatalog ? (
              <p className="font-italic-apple" style={{ fontSize: '1.1rem' }}>
                Loading curated products from Product Service...
              </p>
            ) : visibleProducts.length === 0 ? (
              <div className="editorial-card" style={{ textAlign: 'center' }}>
                <h3 className="font-bold-apple">No matching products found.</h3>
                <p
                  className="font-italic-apple"
                  style={{ color: '#6e6e73', marginTop: '6px' }}
                >
                  Try clearing your search filter or selecting another vendor.
                </p>
              </div>
            ) : (
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <article key={product.productId} className="product-card">
                    <div>
                      <div className="product-card-top">
                        <button
                          className="vendor-badge"
                          onClick={() => setSelectedVendorId(product.vendorId)}
                          title="Filter by this vendor"
                        >
                          {product.vendorName || `Vendor #${product.vendorId}`}
                        </button>
                        <span className="category-tag">
                          {product.category || 'Collection'}
                        </span>
                      </div>

                      <h3 className="product-title font-bold-apple">
                        {product.name}
                      </h3>
                      <p className="product-tagline font-italic-apple">
                        “{product.tagline || 'Designed for everyday precision.'}”
                      </p>
                      <p className="product-desc font-normal-apple">
                        {product.description}
                      </p>
                    </div>

                    <div className="product-card-footer">
                      <div className="price-block">
                        <span className="price-amount font-bold-apple">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <span className="stock-caption font-italic-apple">
                          {product.stockQuantity > 0
                            ? `${product.stockQuantity} in stock • Product #${product.productId}`
                            : 'Out of stock'}
                        </span>
                      </div>

                      <button
                        className="btn-primary"
                        disabled={product.stockQuantity <= 0}
                        onClick={() => addToBag(product)}
                      >
                        <Plus size={15} />
                        <span>
                          {product.stockQuantity > 0 ? 'Add to Bag' : 'Sold Out'}
                        </span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== TAB 2: VENDORS DIRECTORY ==================== */}
        {activeTab === 'vendors' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <p className="hero-eyebrow font-bold-apple">VENDOR DIRECTORY</p>
              <h2 className="hero-headline" style={{ fontSize: '2.4rem' }}>
                <span className="font-bold-apple">Verified Ateliers.</span>{' '}
                <span className="font-italic-apple">
                  Powered by Vendor Service.
                </span>
              </h2>
              <p className="hero-description font-normal-apple">
                Each vendor maintains an independent profile in{' '}
                <code style={{ fontWeight: 700 }}>multivendor_vendor</code>{' '}
                (<code style={{ fontStyle: 'italic' }}>vendor_id</code>,{' '}
                <code style={{ fontStyle: 'italic' }}>name</code>,{' '}
                <code style={{ fontStyle: 'italic' }}>email</code>,{' '}
                <code style={{ fontStyle: 'italic' }}>contact_number</code>) and
                publishes products via inter-service verification.
              </p>
            </div>

            <div className="product-grid">
              {vendors.map((v) => (
                <div key={v.vendorId} className="product-card">
                  <div>
                    <div className="product-card-top">
                      <span className="vendor-badge">
                        VENDOR_ID #{v.vendorId}
                      </span>
                      <span className="category-tag">
                        {v.location || 'Global Atelier'}
                      </span>
                    </div>
                    <h3 className="product-title font-bold-apple">{v.name}</h3>
                    <p className="product-tagline font-italic-apple">
                      “{v.description || 'Independent partner studio.'}”
                    </p>
                    <div
                      className="font-normal-apple"
                      style={{
                        fontSize: '0.86rem',
                        color: '#6e6e73',
                        marginTop: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div>
                        <strong className="font-bold-apple">Email:</strong>{' '}
                        {v.email}
                      </div>
                      <div>
                        <strong className="font-bold-apple">
                          Contact Number:
                        </strong>{' '}
                        {v.contactNumber}
                      </div>
                    </div>
                  </div>

                  <div className="product-card-footer" style={{ marginTop: '20px' }}>
                    <span className="stock-caption font-italic-apple">
                      Active Partner
                    </span>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelectedVendorId(v.vendorId);
                        setActiveTab('storefront');
                      }}
                    >
                      <span>View Products</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ORDER TRACKING ==================== */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <p className="hero-eyebrow font-bold-apple">
                ORDER PLACEMENT & REAL-TIME TRACKING
              </p>
              <h2 className="hero-headline" style={{ fontSize: '2.4rem' }}>
                <span className="font-bold-apple">Every order.</span>{' '}
                <span className="font-italic-apple">
                  Tracked from placement to delivery.
                </span>
              </h2>
              <p className="hero-description font-normal-apple">
                Look up any order by <code style={{ fontWeight: 700 }}>order_id</code> or
                review your multi-vendor order history below.
              </p>
            </div>

            {/* Track by Order ID bar */}
            <form
              onSubmit={handleTrackById}
              className="editorial-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <Package size={20} />
              <span className="font-bold-apple">Quick Order Lookup:</span>
              <input
                type="number"
                min="1"
                placeholder="Enter Order ID (e.g. 1)"
                className="field-input"
                style={{ width: '220px' }}
                value={trackOrderIdInput}
                onChange={(e) => setTrackOrderIdInput(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Track Order Status
              </button>
              {trackedOrder && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setTrackedOrder(null)}
                >
                  Clear Lookup
                </button>
              )}
            </form>

            {trackedOrder && (
              <OrderCard
                order={trackedOrder}
                titlePrefix="Tracked Lookup Result"
              />
            )}

            {!currentUser ? (
              <div className="editorial-card" style={{ textAlign: 'center' }}>
                <h3 className="font-bold-apple">
                  Sign in to view your personal order history.
                </h3>
                <p
                  className="font-italic-apple"
                  style={{ color: '#6e6e73', margin: '8px 0 16px' }}
                >
                  Or click “Customer: Samson” in the top bar for instant access.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign In
                </button>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="editorial-card" style={{ textAlign: 'center' }}>
                <h3 className="font-bold-apple">No orders placed yet.</h3>
                <p
                  className="font-italic-apple"
                  style={{ color: '#6e6e73', margin: '8px 0 16px' }}
                >
                  Add products from multiple vendors to your bag and place your
                  first order.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab('storefront')}
                >
                  Explore Storefront
                </button>
              </div>
            ) : (
              myOrders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))
            )}
          </div>
        )}

        {/* ==================== TAB 4: VENDOR STUDIO ==================== */}
        {activeTab === 'vendor-studio' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <p className="hero-eyebrow font-bold-apple">
                VENDOR MANAGEMENT & INVENTORY CONSOLE
              </p>
              <h2 className="hero-headline" style={{ fontSize: '2.4rem' }}>
                <span className="font-bold-apple">Vendor Studio.</span>{' '}
                <span className="font-italic-apple">
                  Manage your storefront, catalog, and fulfillment.
                </span>
              </h2>
            </div>

            {!currentUser ||
            (currentUser.role !== 'VENDOR' && currentUser.role !== 'ADMIN') ? (
              <div className="editorial-card">
                <h3 className="font-bold-apple" style={{ fontSize: '1.35rem' }}>
                  Vendor Role Required
                </h3>
                <p
                  className="font-italic-apple"
                  style={{ color: '#6e6e73', margin: '8px 0 18px' }}
                >
                  Switch to a Vendor persona using the top bar or register a new
                  Vendor account to access Vendor Studio.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    onClick={() =>
                      quickSwitchAccount(
                        'vendor1@atelier.com',
                        'Cupertino Audio Lab'
                      )
                    }
                  >
                    Switch to Vendor 1 (Cupertino Audio Lab)
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthRole('VENDOR');
                      setAuthModalOpen(true);
                    }}
                  >
                    Register New Vendor Account
                  </button>
                </div>
              </div>
            ) : !myVendor || editingVendor ? (
              <form onSubmit={handleSaveVendor} className="editorial-card">
                <h3 className="font-bold-apple" style={{ fontSize: '1.35rem' }}>
                  {myVendor
                    ? `Edit Vendor Profile (#${myVendor.vendorId})`
                    : 'Register Your Vendor Storefront'}
                </h3>
                <p
                  className="font-italic-apple"
                  style={{ color: '#6e6e73', marginBottom: '20px' }}
                >
                  Stored in MySQL table <code>vendors</code> (
                  <code>vendor_id</code>, <code>name</code>, <code>email</code>,{' '}
                  <code>contact_number</code>).
                </p>

                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">Vendor Name</label>
                    <input
                      className="field-input"
                      required
                      value={vendorForm.name}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, name: e.target.value })
                      }
                      placeholder="e.g. Braun Heritage Lab"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Vendor Email</label>
                    <input
                      type="email"
                      className="field-input"
                      required
                      value={vendorForm.email}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, email: e.target.value })
                      }
                      placeholder="studio@atelier.com"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Contact Number</label>
                    <input
                      className="field-input"
                      required
                      value={vendorForm.contactNumber}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          contactNumber: e.target.value,
                        })
                      }
                      placeholder="+1 (415) 555-0199"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Location</label>
                    <input
                      className="field-input"
                      value={vendorForm.location}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          location: e.target.value,
                        })
                      }
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>

                <div className="field-group" style={{ marginTop: '16px' }}>
                  <label className="field-label">Editorial Description</label>
                  <input
                    className="field-input"
                    value={vendorForm.description}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Precision industrial design objects."
                  />
                </div>

                <div
                  style={{
                    marginTop: '20px',
                    display: 'flex',
                    gap: '12px',
                  }}
                >
                  <button type="submit" className="btn-primary">
                    {myVendor ? 'Save Vendor Changes' : 'Complete Vendor Registration'}
                  </button>
                  {myVendor && (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setEditingVendor(false)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <>
                {/* Active Vendor Summary Header */}
                <div className="vendor-spotlight">
                  <div>
                    <span className="vendor-badge">
                      VERIFIED VENDOR_ID #{myVendor.vendorId}
                    </span>
                    <h3
                      className="font-bold-apple"
                      style={{ fontSize: '1.6rem', marginTop: '8px' }}
                    >
                      {myVendor.name}{' '}
                      <span
                        className="font-italic-apple"
                        style={{ fontWeight: 400, color: '#6e6e73' }}
                      >
                        — {myVendor.location}
                      </span>
                    </h3>
                    <p
                      className="font-normal-apple"
                      style={{ color: '#6e6e73', marginTop: '4px' }}
                    >
                      {myVendor.description}
                    </p>
                    <p
                      className="font-normal-apple"
                      style={{ fontSize: '0.84rem', marginTop: '8px' }}
                    >
                      <strong className="font-bold-apple">Email:</strong>{' '}
                      {myVendor.email} &nbsp;|&nbsp;{' '}
                      <strong className="font-bold-apple">Contact:</strong>{' '}
                      {myVendor.contactNumber}
                    </p>
                  </div>

                  <button
                    className="btn-outline"
                    onClick={() => setEditingVendor(true)}
                  >
                    <Edit3 size={15} /> Edit Store Profile
                  </button>
                </div>

                {/* Add / Edit Product Form */}
                <form onSubmit={handleSaveProduct} className="editorial-card">
                  <h3
                    className="font-bold-apple"
                    style={{ fontSize: '1.25rem', marginBottom: '4px' }}
                  >
                    {editingProductId
                      ? `Update Product #${editingProductId}`
                      : `Publish New Product to ${myVendor.name}`}
                  </h3>
                  <p
                    className="font-italic-apple"
                    style={{ color: '#6e6e73', marginBottom: '18px' }}
                  >
                    Product Service verifies <code>vendor_id</code> #{myVendor.vendorId}{' '}
                    with Vendor Service via OpenFeign before saving.
                  </p>

                  <div className="form-grid">
                    <div className="field-group">
                      <label className="field-label">Product Name</label>
                      <input
                        className="field-input"
                        required
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Studio Condenser Microphone"
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">
                        Editorial Italic Tagline
                      </label>
                      <input
                        className="field-input"
                        value={productForm.tagline}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            tagline: e.target.value,
                          })
                        }
                        placeholder="Warm vocal presence in solid brass."
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Category</label>
                      <input
                        className="field-input"
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            category: e.target.value,
                          })
                        }
                        placeholder="Audio / Workspace / Optics & Craft"
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Price (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="field-input"
                        required
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        className="field-input"
                        required
                        value={productForm.stockQuantity}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            stockQuantity: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="field-group" style={{ marginTop: '14px' }}>
                    <label className="field-label">Product Description</label>
                    <input
                      className="field-input"
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Cardioid studio condenser capsule with ultra-low self-noise."
                    />
                  </div>

                  <div
                    style={{
                      marginTop: '18px',
                      display: 'flex',
                      gap: '10px',
                    }}
                  >
                    <button type="submit" className="btn-primary">
                      <Plus size={15} />
                      <span>
                        {editingProductId ? 'Save Product Changes' : 'Publish Product'}
                      </span>
                    </button>
                    {editingProductId && (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setEditingProductId(null);
                          setProductForm({
                            name: '',
                            tagline: '',
                            description: '',
                            category: 'Audio',
                            price: '299.00',
                            stockQuantity: '15',
                          });
                        }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>

                {/* Vendor Product Listing */}
                <div className="editorial-card">
                  <h3
                    className="font-bold-apple"
                    style={{ fontSize: '1.25rem', marginBottom: '14px' }}
                  >
                    Your Published Products ({myVendorProducts.length})
                  </h3>
                  {myVendorProducts.length === 0 ? (
                    <p className="font-italic-apple" style={{ color: '#6e6e73' }}>
                      No products listed for this vendor yet.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      {myVendorProducts.map((p) => (
                        <div
                          key={p.productId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            border: '1px solid #e5e5ea',
                            borderRadius: '14px',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <strong className="font-bold-apple">
                              #{p.productId} {p.name}
                            </strong>{' '}
                            <span
                              className="font-italic-apple"
                              style={{ color: '#6e6e73' }}
                            >
                              — {p.tagline}
                            </span>
                            <div
                              className="font-normal-apple"
                              style={{ fontSize: '0.82rem', color: '#6e6e73' }}
                            >
                              Price:{' '}
                              <strong className="font-bold-apple">
                                ${Number(p.price).toFixed(2)}
                              </strong>{' '}
                              • Stock Quantity:{' '}
                              <strong className="font-bold-apple">
                                {p.stockQuantity}
                              </strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn-outline"
                              onClick={() => {
                                setEditingProductId(p.productId);
                                setProductForm({
                                  name: p.name,
                                  tagline: p.tagline || '',
                                  description: p.description || '',
                                  category: p.category || 'Audio',
                                  price: String(p.price),
                                  stockQuantity: String(p.stockQuantity),
                                });
                              }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button
                              className="btn-outline"
                              onClick={() => handleDeleteProduct(p.productId)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Incoming Customer Orders for this Vendor */}
                <div className="editorial-card">
                  <h3
                    className="font-bold-apple"
                    style={{ fontSize: '1.25rem', marginBottom: '6px' }}
                  >
                    Incoming Multi-Vendor Orders ({vendorOrders.length})
                  </h3>
                  <p
                    className="font-italic-apple"
                    style={{ color: '#6e6e73', marginBottom: '18px' }}
                  >
                    Update order status to notify customers in real time.
                  </p>

                  {vendorOrders.length === 0 ? (
                    <p className="font-normal-apple" style={{ color: '#6e6e73' }}>
                      No customer orders containing your products yet.
                    </p>
                  ) : (
                    vendorOrders.map((o) => (
                      <div
                        key={o.orderId}
                        style={{
                          border: '1px solid #e5e5ea',
                          borderRadius: '16px',
                          padding: '20px',
                          marginBottom: '16px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <span className="font-bold-apple">
                              Order #{o.orderId}
                            </span>{' '}
                            <span
                              className="font-italic-apple"
                              style={{ color: '#6e6e73' }}
                            >
                              • Customer: {o.customerName || `User #${o.userId}`}
                            </span>
                            <div
                              className="font-normal-apple"
                              style={{ fontSize: '0.82rem', color: '#6e6e73' }}
                            >
                              Ship to: {o.shippingAddress}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              className="vendor-badge"
                              style={{
                                background: '#1d1d1f',
                                color: '#ffffff',
                              }}
                            >
                              {o.orderStatus}
                            </span>
                            {(
                              [
                                'CONFIRMED',
                                'PROCESSING',
                                'SHIPPED',
                                'DELIVERED',
                                'CANCELLED',
                              ] as OrderStatus[]
                            ).map((st) => (
                              <button
                                key={st}
                                className="btn-outline"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.75rem',
                                }}
                                disabled={
                                  o.orderStatus === st ||
                                  o.orderStatus === 'CANCELLED'
                                }
                                onClick={() =>
                                  handleUpdateOrderStatus(o.orderId, st)
                                }
                              >
                                Mark {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                          {o.items.map((item) => (
                            <div
                              key={item.orderItemId}
                              className="font-normal-apple"
                              style={{
                                fontSize: '0.85rem',
                                padding: '6px 0',
                                borderTop: '1px solid #f5f5f7',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>
                                <strong className="font-bold-apple">
                                  {item.productName}
                                </strong>{' '}
                                <em className="font-italic-apple">
                                  ({item.vendorName})
                                </em>{' '}
                                × {item.quantity}
                              </span>
                              <span className="font-bold-apple">
                                ${Number(item.subtotal).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ==================== SHOPPING BAG & MULTI-VENDOR CHECKOUT MODAL ==================== */}
      {bagOpen && (
        <div className="modal-backdrop" onClick={() => setBagOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div>
                <h3 className="font-bold-apple" style={{ fontSize: '1.5rem' }}>
                  Your Bag.{' '}
                  <span
                    className="font-italic-apple"
                    style={{ fontWeight: 400, color: '#6e6e73' }}
                  >
                    {cartVendorCount} vendor(s) selected.
                  </span>
                </h3>
              </div>
              <button
                className="btn-outline"
                onClick={() => setBagOpen(false)}
              >
                Close
              </button>
            </div>

            {cart.length === 0 ? (
              <p
                className="font-italic-apple"
                style={{ color: '#6e6e73', padding: '24px 0' }}
              >
                Your bag is empty. Add items from one or more vendors to place a
                multi-vendor order.
              </p>
            ) : (
              <form onSubmit={handlePlaceOrder}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  {cart.map((item) => (
                    <div
                      key={item.product.productId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        border: '1px solid #e5e5ea',
                        borderRadius: '14px',
                      }}
                    >
                      <div>
                        <span
                          className="vendor-badge"
                          style={{ fontSize: '0.68rem' }}
                        >
                          {item.product.vendorName}
                        </span>
                        <div
                          className="font-bold-apple"
                          style={{ marginTop: '4px' }}
                        >
                          {item.product.name}
                        </div>
                        <div
                          className="font-italic-apple"
                          style={{ fontSize: '0.82rem', color: '#6e6e73' }}
                        >
                          ${Number(item.product.price).toFixed(2)} each
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ padding: '4px 10px' }}
                          onClick={() =>
                            updateBagQuantity(item.product.productId, -1)
                          }
                        >
                          -
                        </button>
                        <span className="font-bold-apple">{item.quantity}</span>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ padding: '4px 10px' }}
                          onClick={() =>
                            updateBagQuantity(item.product.productId, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="field-group" style={{ marginBottom: '18px' }}>
                  <label className="field-label">Delivery Address</label>
                  <input
                    className="field-input"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e5e5ea',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      className="font-italic-apple"
                      style={{ fontSize: '0.85rem', color: '#6e6e73' }}
                    >
                      Total across {cartVendorCount} vendor(s)
                    </div>
                    <div
                      className="font-bold-apple"
                      style={{ fontSize: '1.5rem' }}
                    >
                      ${cartTotal.toFixed(2)}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={placingOrder}
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {placingOrder ? 'Placing Order...' : 'Place Order'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== AUTHENTICATION MODAL ==================== */}
      {authModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setAuthModalOpen(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold-apple" style={{ fontSize: '1.5rem' }}>
              {authMode === 'login'
                ? 'Sign in to Atelier.'
                : 'Create your Atelier ID.'}
            </h3>
            <p
              className="font-italic-apple"
              style={{ color: '#6e6e73', marginBottom: '20px' }}
            >
              Secured with stateless HS256 JWT tokens issued by User Service.
            </p>

            <form
              onSubmit={handleAuthSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {authMode === 'register' && (
                <>
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <input
                      className="field-input"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Samson Jayaraju"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Account Role</label>
                    <select
                      className="field-select"
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as Role)}
                    >
                      <option value="CUSTOMER">
                        CUSTOMER (Browse & Place Orders)
                      </option>
                      <option value="VENDOR">
                        VENDOR (Register Store & Manage Products)
                      </option>
                    </select>
                  </div>
                </>
              )}

              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className="field-input"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="customer@atelier.com"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <input
                  type="password"
                  className="field-input"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() =>
                    setAuthMode(authMode === 'login' ? 'register' : 'login')
                  }
                >
                  {authMode === 'login'
                    ? 'Need an account? Register'
                    : 'Have an account? Sign In'}
                </button>

                <button type="submit" className="btn-primary">
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <div className="toast-banner">{toast}</div>}
    </div>
  );
}

function OrderCard({
  order,
  titlePrefix,
}: {
  order: Order;
  titlePrefix?: string;
}) {
  const currentStepIdx = ORDER_FLOW_STEPS.indexOf(order.orderStatus);

  return (
    <div className="editorial-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span className="vendor-badge">
            {titlePrefix ? `${titlePrefix} • ` : ''}ORDER_ID #{order.orderId}
          </span>
          <h3
            className="font-bold-apple"
            style={{ fontSize: '1.35rem', marginTop: '8px' }}
          >
            Total: ${Number(order.totalAmount).toFixed(2)}{' '}
            <span
              className="font-italic-apple"
              style={{ fontWeight: 400, fontSize: '1rem', color: '#6e6e73' }}
            >
              — Placed on {new Date(order.createdAt).toLocaleString()}
            </span>
          </h3>
          <p
            className="font-normal-apple"
            style={{ fontSize: '0.85rem', color: '#6e6e73', marginTop: '4px' }}
          >
            Shipping Address: {order.shippingAddress}
          </p>
        </div>

        <span
          className="vendor-badge"
          style={{
            background:
              order.orderStatus === 'CANCELLED' ? '#c92a2a' : '#1d1d1f',
            color: '#ffffff',
            padding: '6px 14px',
          }}
        >
          {order.orderStatus}
        </span>
      </div>

      {/* Visual Status Progression */}
      {order.orderStatus !== 'CANCELLED' && (
        <div className="status-steps">
          {ORDER_FLOW_STEPS.map((step, idx) => {
            const cls =
              idx < currentStepIdx
                ? 'completed'
                : idx === currentStepIdx
                ? 'current'
                : '';
            return (
              <span key={step} className={`status-step ${cls}`}>
                {idx + 1}. {step}
              </span>
            );
          })}
        </div>
      )}

      {/* Multi-Vendor Line Items */}
      <div
        style={{
          marginTop: '14px',
          borderTop: '1px solid #e5e5ea',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {order.items.map((item) => (
          <div
            key={item.orderItemId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.9rem',
            }}
          >
            <div>
              <strong className="font-bold-apple">{item.productName}</strong>{' '}
              <span className="font-italic-apple" style={{ color: '#6e6e73' }}>
                sold by {item.vendorName || `Vendor #${item.vendorId}`}
              </span>{' '}
              <span className="font-normal-apple">
                ({item.quantity} × ${Number(item.unitPrice).toFixed(2)})
              </span>
            </div>
            <div className="font-bold-apple">
              ${Number(item.subtotal).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
