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
  Headphones,
  Keyboard,
  Glasses,
  LampDesk,
  Coffee,
  Cpu,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Layers,
  Zap,
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

function renderProductVisualIcon(product: Product) {
  const text = `${product.name} ${product.category || ''}`.toLowerCase();
  if (text.includes('headphone') || text.includes('audio')) {
    return <Headphones size={34} strokeWidth={1.6} color="#1d1d1f" />;
  }
  if (text.includes('keyboard')) {
    return <Keyboard size={34} strokeWidth={1.6} color="#1d1d1f" />;
  }
  if (text.includes('lamp') || text.includes('luminaire')) {
    return <LampDesk size={34} strokeWidth={1.6} color="#1d1d1f" />;
  }
  if (text.includes('optical') || text.includes('frame')) {
    return <Glasses size={34} strokeWidth={1.6} color="#1d1d1f" />;
  }
  if (text.includes('porcelain') || text.includes('pour-over')) {
    return <Coffee size={34} strokeWidth={1.6} color="#1d1d1f" />;
  }
  if (text.includes('dac') || text.includes('amplifier')) {
    return <Cpu size={34} strokeWidth={1.6} color="#1d1d1f" />;
  }
  return <Package size={34} strokeWidth={1.6} color="#1d1d1f" />;
}

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
  const loadCatalog = async (
    vendorFilterId: number | null = selectedVendorId
  ) => {
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
      // ignore
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
  const quickSwitchAccount = async (
    email: string,
    label: string,
    targetTab?: ActiveTab
  ) => {
    try {
      const res = await api.login(email, 'password123');
      saveSession(res.accessToken, res.user);
      notify(`Switched active JWT session to ${label} (${res.user.role})`);
      if (targetTab) {
        setActiveTab(targetTab);
      } else if (res.user.role === 'VENDOR') {
        setActiveTab('vendor-studio');
      } else {
        setActiveTab('storefront');
      }
    } catch (err: any) {
      notify(`Demo login failed: ${err.message}`);
    }
  };

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
  const addToBag = (product: Product, openDrawer = false) => {
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
    if (openDrawer) {
      setBagOpen(true);
    } else {
      notify(`Added "${product.name}" (${product.vendorName}) to your bag.`);
    }
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

  const totalUnitsInCatalog = useMemo(
    () => products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0),
    [products]
  );

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    let activeToken = token;
    if (!activeToken) {
      // Automatically sign in as demo customer so checkout is frictionless!
      try {
        const res = await api.login('customer@atelier.com', 'password123');
        saveSession(res.accessToken, res.user);
        activeToken = res.accessToken;
      } catch {
        setBagOpen(false);
        setAuthModalOpen(true);
        notify('Please sign in to place your multi-vendor order.');
        return;
      }
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
        activeToken
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

  const handleTrackById = async (e: React.FormEvent) => {
    e.preventDefault();
    let activeToken = token;
    if (!activeToken) {
      const res = await api.login('customer@atelier.com', 'password123');
      saveSession(res.accessToken, res.user);
      activeToken = res.accessToken;
    }
    const id = Number(trackOrderIdInput);
    if (!id) return;
    try {
      const order = await api.getOrderById(id, activeToken);
      setTrackedOrder(order);
      notify(`Loaded Order #${order.orderId} (${order.orderStatus}).`);
    } catch (err: any) {
      notify(err.message);
    }
  };

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
        notify(
          `Vendor store "${created.name}" registered (ID #${created.vendorId}).`
        );
      }
      await loadCatalog(selectedVendorId);
    } catch (err: any) {
      notify(err.message);
    }
  };

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
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Top Spring Cloud Microservices Live Status Strip */}
      <div className="arch-strip">
        <div className="arch-strip-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={14} color="#0066cc" />
            <span className="t-bold">Spring Cloud Microservices Mesh:</span>
            <span className="t-italic" style={{ color: '#515154' }}>
              All traffic routed through API Gateway with JWT & Eureka discovery
            </span>
          </div>

          <div className="service-badges">
            <span className="service-dot-item">
              <span className="pulse-dot" />
              <strong className="t-bold">Eureka</strong> :8761
            </span>
            <span className="service-dot-item">
              <span className="pulse-dot" />
              <strong className="t-bold">Gateway</strong> :8080
            </span>
            <span className="service-dot-item">
              <span className="pulse-dot" />
              <strong className="t-bold">User JWT</strong> :8081
            </span>
            <span className="service-dot-item">
              <span className="pulse-dot" />
              <strong className="t-bold">Vendor</strong> :8082
            </span>
            <span className="service-dot-item">
              <span className="pulse-dot" />
              <strong className="t-bold">Product</strong> :8083
            </span>
            <span className="service-dot-item">
              <span className="pulse-dot" />
              <strong className="t-bold">Order</strong> :8084
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Apple Store Header */}
      <header className="apple-header">
        <div className="apple-header-inner">
          <button
            className="brand-btn"
            onClick={() => {
              setSelectedVendorId(null);
              setActiveTab('storefront');
            }}
          >
            <div className="brand-icon-box">A</div>
            <div>
              <div className="t-bold" style={{ fontSize: '1.15rem' }}>
                Atelier Store{' '}
                <span
                  className="t-italic"
                  style={{ fontWeight: 400, color: '#515154' }}
                >
                  Multi-Vendor
                </span>
              </div>
              <div
                className="t-normal"
                style={{ fontSize: '0.72rem', color: '#86868b' }}
              >
                Curated Hardware & Design Marketplace
              </div>
            </div>
          </button>

          {/* Segmented Navigation */}
          <nav className="nav-segmented">
            <button
              className={`nav-seg-btn ${
                activeTab === 'storefront' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('storefront')}
            >
              <Sparkles size={14} />
              <span>1. Shop Catalog ({products.length})</span>
            </button>
            <button
              className={`nav-seg-btn ${
                activeTab === 'vendors' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('vendors')}
            >
              <Store size={14} />
              <span>2. Vendor Stores ({vendors.length})</span>
            </button>
            <button
              className={`nav-seg-btn ${
                activeTab === 'orders' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <Truck size={14} />
              <span>3. Track Orders ({myOrders.length})</span>
            </button>
            <button
              className={`nav-seg-btn ${
                activeTab === 'vendor-studio' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('vendor-studio')}
            >
              <Package size={14} />
              <span>4. Vendor Studio</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="header-right">
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    background: '#f5f5f7',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                  }}
                >
                  <strong className="t-bold">{currentUser.name}</strong>{' '}
                  <span className="t-italic" style={{ color: '#0066cc' }}>
                    • {currentUser.role}
                  </span>
                </div>
                <button
                  className="btn-apple-light"
                  onClick={clearSession}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                className="btn-apple-light"
                onClick={() => {
                  setAuthMode('login');
                  setAuthModalOpen(true);
                }}
              >
                <UserCheck size={15} />
                <span>Sign In / Register</span>
              </button>
            )}

            <button
              className="btn-apple-dark"
              onClick={() => setBagOpen(true)}
            >
              <ShoppingBag size={15} />
              <span>
                Bag ({cart.reduce((s, i) => s + i.quantity, 0)}) • $
                {cartTotal.toFixed(0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Role / Persona Switcher Dock */}
      <div className="role-dock">
        <div className="role-dock-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#15803d" />
            <span className="t-bold" style={{ fontSize: '0.84rem' }}>
              Instant Role Switcher
            </span>
            <span className="t-italic" style={{ fontSize: '0.84rem', color: '#515154' }}>
              — Test Customer Shopping vs. Vendor Management with 1 click:
            </span>
          </div>

          <div className="role-buttons">
            <button
              className={`role-pill ${
                currentUser?.email === 'customer@atelier.com' ? 'active' : ''
              }`}
              onClick={() =>
                quickSwitchAccount(
                  'customer@atelier.com',
                  'Samson (Customer)',
                  'storefront'
                )
              }
            >
              <span>Customer: Samson</span>
              <em className="t-italic" style={{ opacity: 0.8 }}>
                (Browse & Buy)
              </em>
            </button>

            <button
              className={`role-pill ${
                currentUser?.email === 'vendor1@atelier.com' ? 'active' : ''
              }`}
              onClick={() =>
                quickSwitchAccount(
                  'vendor1@atelier.com',
                  'Cupertino Audio Lab',
                  'vendor-studio'
                )
              }
            >
              <span>Vendor #1: Cupertino Audio Lab</span>
              <em className="t-italic" style={{ opacity: 0.8 }}>
                (Manage Store)
              </em>
            </button>

            <button
              className={`role-pill ${
                currentUser?.email === 'vendor2@atelier.com' ? 'active' : ''
              }`}
              onClick={() =>
                quickSwitchAccount(
                  'vendor2@atelier.com',
                  'Studio Minimalist Co.',
                  'vendor-studio'
                )
              }
            >
              <span>Vendor #2: Studio Minimalist Co.</span>
              <em className="t-italic" style={{ opacity: 0.8 }}>
                (Manage Store)
              </em>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="page-shell">
        {/* Interactive 4-Step Guided Flow Strip */}
        <section className="workflow-grid">
          <button
            className={`workflow-step-card ${
              activeTab === 'storefront' ? 'active-step' : ''
            }`}
            onClick={() => setActiveTab('storefront')}
          >
            <span className="step-badge">STEP 01 • PRODUCT SERVICE</span>
            <div className="t-bold" style={{ fontSize: '0.98rem' }}>
              Browse Multi-Vendor Catalog
            </div>
            <div
              className="t-italic"
              style={{ fontSize: '0.84rem', color: '#515154' }}
            >
              Filter products by Vendor ID or category and add items to your bag.
            </div>
          </button>

          <button
            className={`workflow-step-card ${
              activeTab === 'vendors' ? 'active-step' : ''
            }`}
            onClick={() => setActiveTab('vendors')}
          >
            <span className="step-badge">STEP 02 • VENDOR SERVICE</span>
            <div className="t-bold" style={{ fontSize: '0.98rem' }}>
              Explore Registered Vendors
            </div>
            <div
              className="t-italic"
              style={{ fontSize: '0.84rem', color: '#515154' }}
            >
              View verified vendor stores, contact details & per-vendor listings.
            </div>
          </button>

          <button
            className={`workflow-step-card ${
              activeTab === 'orders' ? 'active-step' : ''
            }`}
            onClick={() => setActiveTab('orders')}
          >
            <span className="step-badge">STEP 03 • ORDER SERVICE</span>
            <div className="t-bold" style={{ fontSize: '0.98rem' }}>
              Place & Track Orders Live
            </div>
            <div
              className="t-italic"
              style={{ fontSize: '0.84rem', color: '#515154' }}
            >
              Follow your order status from PLACED to SHIPPED & DELIVERED.
            </div>
          </button>

          <button
            className={`workflow-step-card ${
              activeTab === 'vendor-studio' ? 'active-step' : ''
            }`}
            onClick={() => setActiveTab('vendor-studio')}
          >
            <span className="step-badge">STEP 04 • VENDOR STUDIO</span>
            <div className="t-bold" style={{ fontSize: '0.98rem' }}>
              Vendor Inventory & Fulfillment
            </div>
            <div
              className="t-italic"
              style={{ fontSize: '0.84rem', color: '#515154' }}
            >
              Add new products, update stock quantities & mark orders shipped.
            </div>
          </button>
        </section>

        {/* ==================== TAB 1: STOREFRONT ==================== */}
        {activeTab === 'storefront' && (
          <>
            {/* Apple Editorial Hero */}
            <section className="editorial-hero">
              <div>
                <div className="hero-kicker">
                  <Sparkles size={13} />
                  <span>APPLE EDITORIAL MULTI-VENDOR STOREFRONT</span>
                </div>
                <h1 className="hero-title">
                  <span className="t-bold">
                    Multiple independent vendors.
                  </span>{' '}
                  <span className="t-italic">
                    One seamless shopping experience.
                  </span>
                </h1>
                <p
                  className="t-normal"
                  style={{
                    color: '#515154',
                    fontSize: '1.02rem',
                    maxWidth: '620px',
                  }}
                >
                  Pick products from{' '}
                  <strong className="t-bold">Cupertino Audio Lab</strong>,{' '}
                  <strong className="t-bold">Studio Minimalist Co.</strong>, and{' '}
                  <strong className="t-bold">Kyoto Craft & Optics</strong> in a
                  single checkout. Stock is verified and deducted automatically
                  via <em className="t-italic">Spring Cloud OpenFeign</em>.
                </p>
              </div>

              <div className="hero-kpi-grid">
                <div className="kpi-tile">
                  <span className="kpi-num t-bold">{vendors.length}</span>
                  <span className="t-italic" style={{ fontSize: '0.82rem', color: '#515154' }}>
                    Registered Vendors
                  </span>
                </div>
                <div className="kpi-tile">
                  <span className="kpi-num t-bold">{products.length}</span>
                  <span className="t-italic" style={{ fontSize: '0.82rem', color: '#515154' }}>
                    Active Products
                  </span>
                </div>
                <div className="kpi-tile">
                  <span className="kpi-num t-bold">{totalUnitsInCatalog}</span>
                  <span className="t-italic" style={{ fontSize: '0.82rem', color: '#515154' }}>
                    Total Units in Stock
                  </span>
                </div>
                <div className="kpi-tile">
                  <span className="kpi-num t-bold">JWT</span>
                  <span className="t-italic" style={{ fontSize: '0.82rem', color: '#515154' }}>
                    Secured Gateway APIs
                  </span>
                </div>
              </div>
            </section>

            {/* Filter & Search Toolbar */}
            <section className="catalog-controls">
              <div className="control-row">
                <div className="pill-group">
                  <span
                    className="t-bold"
                    style={{ fontSize: '0.82rem', marginRight: '4px' }}
                  >
                    Vendor Store:
                  </span>
                  <button
                    className={`filter-pill ${
                      selectedVendorId === null ? 'active' : ''
                    }`}
                    onClick={() => setSelectedVendorId(null)}
                  >
                    All Vendors ({vendors.length})
                  </button>
                  {vendors.map((v) => (
                    <button
                      key={v.vendorId}
                      className={`filter-pill ${
                        selectedVendorId === v.vendorId ? 'active' : ''
                      }`}
                      onClick={() => setSelectedVendorId(v.vendorId)}
                    >
                      <span>{v.name}</span>{' '}
                      <em className="t-italic" style={{ opacity: 0.78 }}>
                        (#{v.vendorId})
                      </em>
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-row">
                <div className="pill-group">
                  <span
                    className="t-bold"
                    style={{ fontSize: '0.82rem', marginRight: '4px' }}
                  >
                    Category:
                  </span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`filter-pill ${
                        selectedCategory === cat ? 'active' : ''
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
                  <div className="search-box">
                    <Search
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#86868b',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search product name, vendor, or feature..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-apple-light"
                    onClick={() => loadCatalog(selectedVendorId)}
                    title="Refresh Products"
                  >
                    <RefreshCw size={15} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Active Vendor Spotlight Banner when a vendor is selected */}
            {activeVendorSpotlight && (
              <div
                className="surface-card"
                style={{
                  background: '#fafafa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <span className="step-badge">
                    FILTERED BY VENDOR_ID #{activeVendorSpotlight.vendorId} •{' '}
                    GET /api/products/vendor/{activeVendorSpotlight.vendorId}
                  </span>
                  <h2
                    className="t-bold"
                    style={{ fontSize: '1.65rem', marginTop: '4px' }}
                  >
                    {activeVendorSpotlight.name}{' '}
                    <span
                      className="t-italic"
                      style={{ fontWeight: 400, color: '#515154' }}
                    >
                      — {activeVendorSpotlight.location}
                    </span>
                  </h2>
                  <p
                    className="t-normal"
                    style={{ color: '#515154', marginTop: '4px' }}
                  >
                    {activeVendorSpotlight.description}
                  </p>
                  <div
                    className="t-normal"
                    style={{
                      fontSize: '0.82rem',
                      marginTop: '8px',
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>
                      <strong className="t-bold">Email:</strong>{' '}
                      {activeVendorSpotlight.email}
                    </span>
                    <span>
                      <strong className="t-bold">Contact:</strong>{' '}
                      {activeVendorSpotlight.contactNumber}
                    </span>
                  </div>
                </div>
                <button
                  className="btn-apple-light"
                  onClick={() => setSelectedVendorId(null)}
                >
                  Clear Vendor Filter
                </button>
              </div>
            )}

            {/* Product Showcase Cards */}
            {loadingCatalog ? (
              <div className="surface-card" style={{ textAlign: 'center' }}>
                <p className="t-italic" style={{ fontSize: '1.1rem' }}>
                  Loading catalog from Product Service...
                </p>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="surface-card" style={{ textAlign: 'center' }}>
                <h3 className="t-bold">No products match your filter.</h3>
                <p
                  className="t-italic"
                  style={{ color: '#515154', margin: '8px 0 16px' }}
                >
                  Reset the search or vendor filter to view all products.
                </p>
                <button
                  className="btn-apple-dark"
                  onClick={() => {
                    setSelectedVendorId(null);
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="showcase-grid">
                {visibleProducts.map((product) => (
                  <article key={product.productId} className="showcase-card">
                    {/* Top Apple Pedestal with Icon & Badges */}
                    <div className="product-visual-pedestal">
                      <div className="pedestal-top-badges">
                        <button
                          className="vendor-chip-btn"
                          onClick={() => setSelectedVendorId(product.vendorId)}
                          title="Click to filter by this vendor"
                        >
                          <Store size={12} />
                          <span>
                            {product.vendorName || `Vendor #${product.vendorId}`}
                          </span>
                        </button>

                        <span
                          className={`stock-pill ${
                            product.stockQuantity > 0 ? 'in-stock' : 'out-stock'
                          }`}
                        >
                          {product.stockQuantity > 0
                            ? `${product.stockQuantity} in stock`
                            : 'Sold Out'}
                        </span>
                      </div>

                      <div className="pedestal-illustration">
                        {renderProductVisualIcon(product)}
                      </div>

                      <div
                        style={{
                          textAlign: 'center',
                          fontSize: '0.72rem',
                          color: '#86868b',
                        }}
                        className="t-italic"
                      >
                        Product ID #{product.productId} • Vendor ID #
                        {product.vendorId}
                      </div>
                    </div>

                    {/* Product Info & Typography Body */}
                    <div className="showcase-body">
                      <div>
                        <div className="showcase-category">
                          {product.category || 'Hardware'}
                        </div>
                        <h3 className="showcase-title t-bold">
                          {product.name}
                        </h3>
                        <p className="showcase-tagline t-italic">
                          “
                          {product.tagline ||
                            'Engineered with uncompromising precision.'}
                          ”
                        </p>
                        <p className="showcase-desc t-normal">
                          {product.description}
                        </p>
                      </div>

                      <div className="showcase-footer">
                        <div>
                          <div className="price-large t-bold">
                            ${Number(product.price).toFixed(2)}
                          </div>
                          <div
                            className="t-italic"
                            style={{ fontSize: '0.75rem', color: '#86868b' }}
                          >
                            Free multi-vendor delivery
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-apple-light"
                            disabled={product.stockQuantity <= 0}
                            onClick={() => addToBag(product, true)}
                            title="Add to bag and open checkout"
                          >
                            <Zap size={14} />
                            <span>Buy</span>
                          </button>
                          <button
                            className="btn-apple-dark"
                            disabled={product.stockQuantity <= 0}
                            onClick={() => addToBag(product, false)}
                          >
                            <Plus size={15} />
                            <span>Add to Bag</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== TAB 2: VENDOR STORES DIRECTORY ==================== */}
        {activeTab === 'vendors' && (
          <div>
            <div className="surface-card" style={{ background: '#fafafa' }}>
              <span className="step-badge">
                VENDOR SERVICE • MYSQL TABLE: multivendor_vendor.vendors
              </span>
              <h2
                className="t-bold"
                style={{ fontSize: '2.1rem', marginTop: '6px' }}
              >
                Registered Flagship Vendors.{' '}
                <span className="t-italic" style={{ fontWeight: 400 }}>
                  Each managing its own inventory.
                </span>
              </h2>
              <p
                className="t-normal"
                style={{ color: '#515154', marginTop: '6px' }}
              >
                Click <strong className="t-bold">“Browse Vendor Catalog”</strong>{' '}
                on any vendor card to filter products specifically from that
                vendor (`GET /api/products/vendor/{'{vendorId}'}`).
              </p>
            </div>

            <div className="showcase-grid">
              {vendors.map((v) => {
                const vendorProds = products.filter(
                  (p) => p.vendorId === v.vendorId
                );
                return (
                  <div key={v.vendorId} className="showcase-card">
                    <div className="product-visual-pedestal">
                      <div className="pedestal-top-badges">
                        <span className="vendor-chip-btn">
                          VENDOR_ID #{v.vendorId}
                        </span>
                        <span className="stock-pill in-stock">
                          {vendorProds.length} Products Listed
                        </span>
                      </div>

                      <div className="pedestal-illustration">
                        <Store size={34} strokeWidth={1.6} color="#1d1d1f" />
                      </div>

                      <div
                        className="t-italic"
                        style={{
                          textAlign: 'center',
                          fontSize: '0.78rem',
                          color: '#515154',
                        }}
                      >
                        <MapPin
                          size={12}
                          style={{ display: 'inline', marginRight: '4px' }}
                        />
                        {v.location || 'Global Partner'}
                      </div>
                    </div>

                    <div className="showcase-body">
                      <div>
                        <h3 className="showcase-title t-bold">{v.name}</h3>
                        <p className="showcase-tagline t-italic">
                          “{v.description || 'Verified independent vendor.'}”
                        </p>

                        <div
                          className="t-normal"
                          style={{
                            fontSize: '0.84rem',
                            color: '#515154',
                            marginTop: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            background: '#f5f5f7',
                            padding: '12px 14px',
                            borderRadius: '12px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <Mail size={14} />
                            <span>{v.email}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <Phone size={14} />
                            <span>{v.contactNumber}</span>
                          </div>
                        </div>
                      </div>

                      <div className="showcase-footer" style={{ marginTop: '18px' }}>
                        <span
                          className="t-italic"
                          style={{ fontSize: '0.8rem', color: '#515154' }}
                        >
                          Verified Store
                        </span>
                        <button
                          className="btn-apple-dark"
                          onClick={() => {
                            setSelectedVendorId(v.vendorId);
                            setActiveTab('storefront');
                          }}
                        >
                          <span>Browse Vendor Catalog</span>
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ORDER TRACKING ==================== */}
        {activeTab === 'orders' && (
          <div>
            <div className="surface-card" style={{ background: '#fafafa' }}>
              <span className="step-badge">
                ORDER SERVICE • MYSQL TABLE: multivendor_order.orders
              </span>
              <h2
                className="t-bold"
                style={{ fontSize: '2.1rem', marginTop: '6px' }}
              >
                Order Placement & Live Tracking.{' '}
                <span className="t-italic" style={{ fontWeight: 400 }}>
                  Real-time multi-vendor fulfillment.
                </span>
              </h2>

              <form
                onSubmit={handleTrackById}
                style={{
                  marginTop: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="number"
                  min="1"
                  placeholder="Lookup by Order ID (e.g. 1)"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '999px',
                    border: '1px solid #d2d2d7',
                    width: '240px',
                    fontSize: '0.88rem',
                  }}
                  value={trackOrderIdInput}
                  onChange={(e) => setTrackOrderIdInput(e.target.value)}
                />
                <button type="submit" className="btn-apple-dark">
                  <Search size={14} />
                  <span>Lookup Order ID</span>
                </button>
                {trackedOrder && (
                  <button
                    type="button"
                    className="btn-apple-light"
                    onClick={() => setTrackedOrder(null)}
                  >
                    Clear Lookup
                  </button>
                )}
              </form>
            </div>

            {trackedOrder && (
              <OrderTimelineCard
                order={trackedOrder}
                badgeLabel="LOOKUP RESULT"
              />
            )}

            {!currentUser ? (
              <div className="surface-card" style={{ textAlign: 'center' }}>
                <h3 className="t-bold" style={{ fontSize: '1.3rem' }}>
                  Switch to a Customer persona to view order history
                </h3>
                <p
                  className="t-italic"
                  style={{ color: '#515154', margin: '8px 0 18px' }}
                >
                  Click below to sign in as Samson (Customer) and inspect your
                  placed orders.
                </p>
                <button
                  className="btn-apple-dark"
                  onClick={() =>
                    quickSwitchAccount(
                      'customer@atelier.com',
                      'Samson (Customer)',
                      'orders'
                    )
                  }
                >
                  Switch to Customer: Samson
                </button>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="surface-card" style={{ textAlign: 'center' }}>
                <h3 className="t-bold">No orders in your history yet.</h3>
                <p
                  className="t-italic"
                  style={{ color: '#515154', margin: '8px 0 16px' }}
                >
                  Add products from multiple vendors to your Bag and place an
                  order!
                </p>
                <button
                  className="btn-apple-dark"
                  onClick={() => setActiveTab('storefront')}
                >
                  Go to Storefront
                </button>
              </div>
            ) : (
              myOrders.map((order) => (
                <OrderTimelineCard key={order.orderId} order={order} />
              ))
            )}
          </div>
        )}

        {/* ==================== TAB 4: VENDOR STUDIO ==================== */}
        {activeTab === 'vendor-studio' && (
          <div>
            <div className="surface-card" style={{ background: '#fafafa' }}>
              <span className="step-badge">
                VENDOR MANAGEMENT CONSOLE • SECURED BY VENDOR JWT
              </span>
              <h2
                className="t-bold"
                style={{ fontSize: '2.1rem', marginTop: '6px' }}
              >
                Vendor Studio.{' '}
                <span className="t-italic" style={{ fontWeight: 400 }}>
                  Register your store, publish products & ship orders.
                </span>
              </h2>
            </div>

            {!currentUser ||
            (currentUser.role !== 'VENDOR' && currentUser.role !== 'ADMIN') ? (
              <div className="surface-card" style={{ textAlign: 'center' }}>
                <h3 className="t-bold" style={{ fontSize: '1.4rem' }}>
                  Switch to a Vendor Account to Manage Products & Orders
                </h3>
                <p
                  className="t-italic"
                  style={{ color: '#515154', margin: '8px 0 20px' }}
                >
                  Choose one of the pre-configured vendor stores below or
                  register your own vendor account:
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    className="btn-apple-dark"
                    onClick={() =>
                      quickSwitchAccount(
                        'vendor1@atelier.com',
                        'Cupertino Audio Lab',
                        'vendor-studio'
                      )
                    }
                  >
                    Open as Vendor #1 (Cupertino Audio Lab)
                  </button>
                  <button
                    className="btn-apple-light"
                    onClick={() =>
                      quickSwitchAccount(
                        'vendor2@atelier.com',
                        'Studio Minimalist Co.',
                        'vendor-studio'
                      )
                    }
                  >
                    Open as Vendor #2 (Studio Minimalist Co.)
                  </button>
                </div>
              </div>
            ) : !myVendor || editingVendor ? (
              <form onSubmit={handleSaveVendor} className="surface-card">
                <h3 className="t-bold" style={{ fontSize: '1.35rem' }}>
                  {myVendor
                    ? `Edit Vendor Profile (#${myVendor.vendorId})`
                    : 'Register Your Vendor Storefront'}
                </h3>
                <p
                  className="t-italic"
                  style={{ color: '#515154', marginBottom: '20px' }}
                >
                  Persisted in <code>multivendor_vendor.vendors</code>.
                </p>

                <div className="input-grid">
                  <div className="input-field">
                    <label>Vendor Name</label>
                    <input
                      required
                      value={vendorForm.name}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, name: e.target.value })
                      }
                      placeholder="e.g. Braun Heritage Lab"
                    />
                  </div>
                  <div className="input-field">
                    <label>Vendor Email</label>
                    <input
                      type="email"
                      required
                      value={vendorForm.email}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, email: e.target.value })
                      }
                      placeholder="studio@atelier.com"
                    />
                  </div>
                  <div className="input-field">
                    <label>Contact Number</label>
                    <input
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
                  <div className="input-field">
                    <label>Location</label>
                    <input
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

                <div className="input-field" style={{ marginTop: '14px' }}>
                  <label>Store Description</label>
                  <input
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
                  style={{ marginTop: '20px', display: 'flex', gap: '10px' }}
                >
                  <button type="submit" className="btn-apple-dark">
                    {myVendor
                      ? 'Save Vendor Changes'
                      : 'Complete Vendor Registration'}
                  </button>
                  {myVendor && (
                    <button
                      type="button"
                      className="btn-apple-light"
                      onClick={() => setEditingVendor(false)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <>
                {/* Vendor Store Profile Banner */}
                <div
                  className="surface-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div>
                    <span className="step-badge">
                      ACTIVE VENDOR STORE • VENDOR_ID #{myVendor.vendorId}
                    </span>
                    <h3
                      className="t-bold"
                      style={{ fontSize: '1.6rem', marginTop: '4px' }}
                    >
                      {myVendor.name}{' '}
                      <span
                        className="t-italic"
                        style={{ fontWeight: 400, color: '#515154' }}
                      >
                        ({myVendor.location})
                      </span>
                    </h3>
                    <p className="t-normal" style={{ color: '#515154' }}>
                      {myVendor.description}
                    </p>
                    <p
                      className="t-normal"
                      style={{ fontSize: '0.82rem', marginTop: '6px' }}
                    >
                      <strong className="t-bold">Email:</strong> {myVendor.email}{' '}
                      &nbsp;|&nbsp;{' '}
                      <strong className="t-bold">Contact:</strong>{' '}
                      {myVendor.contactNumber}
                    </p>
                  </div>

                  <button
                    className="btn-apple-light"
                    onClick={() => setEditingVendor(true)}
                  >
                    <Edit3 size={14} />
                    <span>Edit Store Profile</span>
                  </button>
                </div>

                {/* Two-Column Vendor Studio Layout */}
                <div className="studio-two-col">
                  {/* Left Column: Publish / Edit Product */}
                  <form onSubmit={handleSaveProduct} className="surface-card">
                    <span className="step-badge">PRODUCT PUBLISHER</span>
                    <h3
                      className="t-bold"
                      style={{ fontSize: '1.25rem', margin: '4px 0' }}
                    >
                      {editingProductId
                        ? `Edit Product #${editingProductId}`
                        : 'Add New Product to Store'}
                    </h3>
                    <p
                      className="t-italic"
                      style={{
                        color: '#515154',
                        fontSize: '0.86rem',
                        marginBottom: '16px',
                      }}
                    >
                      Verified against Vendor Service via OpenFeign before
                      saving.
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div className="input-field">
                        <label>Product Name</label>
                        <input
                          required
                          value={productForm.name}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g. Studio Reference Monitor"
                        />
                      </div>

                      <div className="input-field">
                        <label>Editorial Italic Tagline</label>
                        <input
                          value={productForm.tagline}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              tagline: e.target.value,
                            })
                          }
                          placeholder="Pure acoustic accuracy in brushed aluminum."
                        />
                      </div>

                      <div className="input-grid">
                        <div className="input-field">
                          <label>Category</label>
                          <input
                            value={productForm.category}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                category: e.target.value,
                              })
                            }
                            placeholder="Audio / Workspace"
                          />
                        </div>
                        <div className="input-field">
                          <label>Price ($ USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
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
                        <div className="input-field">
                          <label>Stock Quantity</label>
                          <input
                            type="number"
                            min="0"
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

                      <div className="input-field">
                        <label>Description</label>
                        <input
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Custom drivers with anodized chassis."
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          marginTop: '8px',
                        }}
                      >
                        <button type="submit" className="btn-apple-dark">
                          <Plus size={15} />
                          <span>
                            {editingProductId
                              ? 'Update Product'
                              : 'Publish Product'}
                          </span>
                        </button>
                        {editingProductId && (
                          <button
                            type="button"
                            className="btn-apple-light"
                            onClick={() => setEditingProductId(null)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>

                  {/* Right Column: Vendor Inventory & Incoming Orders */}
                  <div>
                    <div className="surface-card">
                      <span className="step-badge">STORE INVENTORY</span>
                      <h3
                        className="t-bold"
                        style={{ fontSize: '1.25rem', margin: '4px 0 14px' }}
                      >
                        Products by {myVendor.name} ({myVendorProducts.length})
                      </h3>

                      {myVendorProducts.length === 0 ? (
                        <p className="t-italic" style={{ color: '#515154' }}>
                          No products listed yet. Use the form on the left to
                          publish your first item.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          {myVendorProducts.map((p) => (
                            <div
                              key={p.productId}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 14px',
                                border: '1px solid #e8e8ed',
                                borderRadius: '14px',
                                background: '#fafafa',
                                gap: '10px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div>
                                <div className="t-bold">
                                  #{p.productId} {p.name}
                                </div>
                                <div
                                  className="t-italic"
                                  style={{
                                    fontSize: '0.82rem',
                                    color: '#515154',
                                  }}
                                >
                                  ${Number(p.price).toFixed(2)} •{' '}
                                  {p.stockQuantity} units in stock
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn-apple-light"
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
                                  <Edit3 size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  className="btn-apple-light"
                                  onClick={() =>
                                    handleDeleteProduct(p.productId)
                                  }
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vendor Orders Fulfillment */}
                    <div className="surface-card">
                      <span className="step-badge">ORDER FULFILLMENT</span>
                      <h3
                        className="t-bold"
                        style={{ fontSize: '1.25rem', margin: '4px 0 14px' }}
                      >
                        Incoming Customer Orders ({vendorOrders.length})
                      </h3>

                      {vendorOrders.length === 0 ? (
                        <p className="t-italic" style={{ color: '#515154' }}>
                          No incoming orders for this vendor yet.
                        </p>
                      ) : (
                        vendorOrders.map((o) => (
                          <div
                            key={o.orderId}
                            style={{
                              border: '1px solid #e8e8ed',
                              borderRadius: '16px',
                              padding: '16px',
                              marginBottom: '12px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginBottom: '10px',
                              }}
                            >
                              <div>
                                <span className="t-bold">
                                  Order #{o.orderId}
                                </span>{' '}
                                <span
                                  className="t-italic"
                                  style={{ color: '#515154', fontSize: '0.85rem' }}
                                >
                                  • {o.customerName || `User #${o.userId}`}
                                </span>
                              </div>
                              <span className="stock-pill in-stock">
                                Status: {o.orderStatus}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                gap: '6px',
                                flexWrap: 'wrap',
                                marginBottom: '10px',
                              }}
                            >
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
                                  className="btn-apple-light"
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '0.73rem',
                                  }}
                                  disabled={
                                    o.orderStatus === st ||
                                    o.orderStatus === 'CANCELLED'
                                  }
                                  onClick={() =>
                                    handleUpdateOrderStatus(o.orderId, st)
                                  }
                                >
                                  Set {st}
                                </button>
                              ))}
                            </div>

                            {o.items.map((item) => (
                              <div
                                key={item.orderItemId}
                                style={{
                                  fontSize: '0.82rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  borderTop: '1px solid #f5f5f7',
                                  paddingTop: '6px',
                                  marginTop: '6px',
                                }}
                              >
                                <span>
                                  <strong className="t-bold">
                                    {item.productName}
                                  </strong>{' '}
                                  <em className="t-italic">
                                    ({item.vendorName})
                                  </em>{' '}
                                  × {item.quantity}
                                </span>
                                <span className="t-bold">
                                  ${Number(item.subtotal).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ==================== SHOPPING BAG & MULTI-VENDOR CHECKOUT MODAL ==================== */}
      {bagOpen && (
        <div className="overlay-backdrop" onClick={() => setBagOpen(false)}>
          <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div>
                <span className="step-badge">MULTI-VENDOR CHECKOUT</span>
                <h3 className="t-bold" style={{ fontSize: '1.5rem' }}>
                  Your Shopping Bag.{' '}
                  <span
                    className="t-italic"
                    style={{ fontWeight: 400, color: '#515154' }}
                  >
                    {cartVendorCount} vendor(s).
                  </span>
                </h3>
              </div>
              <button
                className="btn-apple-light"
                onClick={() => setBagOpen(false)}
              >
                Close
              </button>
            </div>

            {cart.length === 0 ? (
              <p
                className="t-italic"
                style={{ color: '#515154', padding: '24px 0' }}
              >
                Your bag is empty. Click “+ Add to Bag” on any product to start
                a multi-vendor order.
              </p>
            ) : (
              <form onSubmit={handlePlaceOrder}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginBottom: '18px',
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
                        border: '1px solid #e8e8ed',
                        borderRadius: '14px',
                        background: '#fafafa',
                      }}
                    >
                      <div>
                        <span
                          className="step-badge"
                          style={{ fontSize: '0.66rem' }}
                        >
                          {item.product.vendorName}
                        </span>
                        <div className="t-bold">{item.product.name}</div>
                        <div
                          className="t-italic"
                          style={{ fontSize: '0.82rem', color: '#515154' }}
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
                          className="btn-apple-light"
                          style={{ padding: '4px 10px' }}
                          onClick={() =>
                            updateBagQuantity(item.product.productId, -1)
                          }
                        >
                          -
                        </button>
                        <span className="t-bold">{item.quantity}</span>
                        <button
                          type="button"
                          className="btn-apple-light"
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

                <div className="input-field" style={{ marginBottom: '18px' }}>
                  <label>Shipping Address</label>
                  <input
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e8e8ed',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      className="t-italic"
                      style={{ fontSize: '0.84rem', color: '#515154' }}
                    >
                      Order Total ({cartVendorCount} vendor stores)
                    </div>
                    <div className="t-bold" style={{ fontSize: '1.55rem' }}>
                      ${cartTotal.toFixed(2)}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-apple-dark"
                    disabled={placingOrder}
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {placingOrder
                        ? 'Processing Order...'
                        : 'Place Multi-Vendor Order'}
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
          className="overlay-backdrop"
          onClick={() => setAuthModalOpen(false)}
        >
          <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
            <span className="step-badge">USER SERVICE • JWT AUTHENTICATION</span>
            <h3
              className="t-bold"
              style={{ fontSize: '1.5rem', marginTop: '4px' }}
            >
              {authMode === 'login'
                ? 'Sign in to Atelier.'
                : 'Create your Atelier Account.'}
            </h3>
            <p
              className="t-italic"
              style={{ color: '#515154', marginBottom: '18px' }}
            >
              Issues a signed HS256 Bearer token verified across all services.
            </p>

            <form
              onSubmit={handleAuthSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {authMode === 'register' && (
                <>
                  <div className="input-field">
                    <label>Full Name</label>
                    <input
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Samson Jayaraju"
                    />
                  </div>
                  <div className="input-field">
                    <label>Select Role</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as Role)}
                    >
                      <option value="CUSTOMER">
                        CUSTOMER (Shop & Place Multi-Vendor Orders)
                      </option>
                      <option value="VENDOR">
                        VENDOR (Register Store & Manage Inventory)
                      </option>
                    </select>
                  </div>
                </>
              )}

              <div className="input-field">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="customer@atelier.com"
                />
              </div>

              <div className="input-field">
                <label>Password</label>
                <input
                  type="password"
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
                  className="btn-apple-light"
                  onClick={() =>
                    setAuthMode(authMode === 'login' ? 'register' : 'login')
                  }
                >
                  {authMode === 'login'
                    ? 'Create New Account'
                    : 'Already have an account?'}
                </button>

                <button type="submit" className="btn-apple-dark">
                  {authMode === 'login' ? 'Sign In' : 'Register & Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-float">
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

function OrderTimelineCard({
  order,
  badgeLabel,
}: {
  order: Order;
  badgeLabel?: string;
}) {
  const currentIdx = ORDER_FLOW_STEPS.indexOf(order.orderStatus);

  return (
    <div className="surface-card">
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
          <span className="step-badge">
            {badgeLabel ? `${badgeLabel} • ` : ''}ORDER_ID #{order.orderId}
          </span>
          <h3
            className="t-bold"
            style={{ fontSize: '1.4rem', marginTop: '4px' }}
          >
            Order Total: ${Number(order.totalAmount).toFixed(2)}{' '}
            <span
              className="t-italic"
              style={{ fontWeight: 400, fontSize: '0.95rem', color: '#515154' }}
            >
              — {new Date(order.createdAt).toLocaleString()}
            </span>
          </h3>
          <p
            className="t-normal"
            style={{ fontSize: '0.84rem', color: '#515154', marginTop: '2px' }}
          >
            Delivery Address: {order.shippingAddress}
          </p>
        </div>

        <span className="stock-pill in-stock" style={{ fontSize: '0.8rem' }}>
          Current Status: {order.orderStatus}
        </span>
      </div>

      {/* 5-Stage Visual Order Flow */}
      {order.orderStatus !== 'CANCELLED' && (
        <div className="timeline-track">
          {ORDER_FLOW_STEPS.map((step, idx) => {
            const stateClass =
              idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : '';
            return (
              <div key={step} className={`timeline-node ${stateClass}`}>
                <CheckCircle2 size={14} />
                <span>
                  {idx + 1}. {step}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Vendor Items Breakdown */}
      <div
        style={{
          borderTop: '1px solid #e8e8ed',
          paddingTop: '14px',
          marginTop: '10px',
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
              padding: '8px 12px',
              background: '#f5f5f7',
              borderRadius: '10px',
              fontSize: '0.88rem',
            }}
          >
            <div>
              <strong className="t-bold">{item.productName}</strong>{' '}
              <span className="t-italic" style={{ color: '#0066cc' }}>
                • Sold by {item.vendorName || `Vendor #${item.vendorId}`}
              </span>{' '}
              <span className="t-normal" style={{ color: '#515154' }}>
                (Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)})
              </span>
            </div>
            <div className="t-bold">${Number(item.subtotal).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
