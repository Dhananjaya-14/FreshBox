import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, ChevronDown, ChevronRight, CircleHelp, Clock3, Facebook, Instagram, Leaf, LockKeyhole, LogOut, Menu, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sprout, Truck, UserRound, X } from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import { API_ORIGIN, api, jsonBody } from "./services/api.js";

const money = (value) => `LKR ${Number(value || 0).toLocaleString("en-LK")}`;
const imageFor = (product) => product.images?.[0] || "";
const fallbackProducts = [];
const cartChanged = () => window.dispatchEvent(new Event("freshbox:cart-changed"));

function Header() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const updateCount = () => {
      if (user) api("/cart").then((cart) => setCount(cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0)).catch(() => setCount(0));
      else setCount(0);
    };
    updateCount();
    window.addEventListener("freshbox:cart-changed", updateCount);
    return () => window.removeEventListener("freshbox:cart-changed", updateCount);
  }, [user]);

  async function logout() {
    await signOut();
    navigate("/");
  }
  return <>
    <div className="topline"><span>Good food, grown close.</span><span className="topline-right"><Truck size={14} /> Fresh local delivery across Sri Lanka</span></div>
    <header className="header">
      <Link to="/" className="brand" aria-label="FreshBox home"><span className="brand-icon"><Sprout size={24} /></span><span>fresh<span>box</span><small>FROM OUR FARMERS</small></span></Link>
      <button className="mobile-toggle icon-button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={open ? "nav nav-open" : "nav"} aria-label="Main navigation">
        <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
        <NavLink to="/shop" onClick={() => setOpen(false)}>Shop</NavLink>
        <NavLink to="/packages" onClick={() => setOpen(false)}>Fresh boxes</NavLink>
        <NavLink to="/about" onClick={() => setOpen(false)}>Our story</NavLink>
        <NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink>
      </nav>
      <div className="header-actions">
        <Link className="icon-button bag-button" to={user ? "/cart" : "/login"} aria-label="Shopping bag"><ShoppingBag size={20} />{count > 0 && <span className="bag-count">{count}</span>}</Link>
        {user ? <div className="account-menu"><Link to={user.role === "admin" || user.role === "staff" ? "/admin" : "/account"} className="account-link"><UserRound size={17} />{user.name.split(" ")[0]}</Link><button className="icon-button logout-button" title="Sign out" onClick={logout}><LogOut size={17} /></button></div> : <Link className="button button-dark sign-in" to="/login">Sign in <ArrowUpRight size={16} /></Link>}
      </div>
    </header>
  </>;
}

function Footer() {
  return <footer className="footer">
    <div className="footer-main">
      <div className="footer-brand"><Link to="/" className="brand brand-light"><span className="brand-icon"><Sprout size={24} /></span><span>fresh<span>box</span><small>FROM OUR FARMERS</small></span></Link><p>Seasonal goodness from local growers, packed with care and brought right to your door.</p><div className="socials"><a href="https://instagram.com" aria-label="Instagram"><Instagram size={18} /></a><a href="https://facebook.com" aria-label="Facebook"><Facebook size={18} /></a></div></div>
      <div><h4>Explore</h4><Link to="/shop">Shop produce</Link><Link to="/packages">Our fresh boxes</Link><Link to="/about">Our story</Link><Link to="/contact">Contact us</Link></div>
      <div><h4>Need a hand?</h4><Link to="/faq">FAQs</Link><Link to="/contact">Delivery information</Link><Link to="/account">My account</Link><a href="mailto:hello@freshbox.lk">hello@freshbox.lk</a></div>
      <div className="footer-note"><Leaf size={22} /><p>Freshness you can feel good about. Proudly supporting Sri Lankan farmers.</p></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} FreshBox. All rights reserved.</span><span><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></span></div>
  </footer>;
}

function App() {
  const { ready } = useAuth();
  if (!ready) return <div className="page-loading"><span className="loader" />Preparing your FreshBox…</div>;
  return <>
    <Header />
    <main>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/about" element={<InfoPage title="Good food starts close to home." eyebrow="Our story" text="FreshBox connects Sri Lankan families with seasonal produce from local farmers. We believe good food should be fresh, thoughtfully sourced, and simple to enjoy." />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/privacy" element={<InfoPage title="Privacy matters." eyebrow="Privacy policy" text="Your account details are used to fulfil orders and support your FreshBox experience. Contact our team to request access, correction, or deletion of your account information." />} />
        <Route path="/terms" element={<InfoPage title="Terms and conditions." eyebrow="The details" text="Orders are subject to product availability, delivery coverage, and the final policies set by FreshBox. Prices and delivery charges are confirmed at checkout." />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route path="/cart" element={<Protected><CartPage /></Protected>} />
        <Route path="/checkout" element={<Protected><CheckoutPage /></Protected>} />
        <Route path="/account" element={<Protected><AccountPage /></Protected>} />
        <Route path="/orders/:id" element={<Protected><OrderPage /></Protected>} />
        <Route path="/subscriptions" element={<Protected><SubscriptionsPage /></Protected>} />
        <Route path="/support" element={<Protected><SupportPage /></Protected>} />
        <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </>;
}

function SectionHeading({ eyebrow, title, text, action }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div>;
}

function HomePage() {
  const [products, setProducts] = useState(fallbackProducts);
  const [packages, setPackages] = useState([]);
  useEffect(() => {
    api("/products?sort=popular").then(setProducts).catch(() => {});
    api("/packages").then(setPackages).catch(() => {});
  }, []);
  return <>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> FRESH FROM OUR FARMERS</span><h1>A little more<br /><em>goodness</em> in<br />every day.</h1><p>Seasonal fruits and vegetables, grown close to home and delivered with care.</p><div className="hero-actions"><Link to="/shop" className="button button-lime">Shop the harvest <ArrowRight size={17} /></Link><Link to="/about" className="hero-link">Meet your farmers <ArrowUpRight size={16} /></Link></div><div className="hero-proof"><div className="proof-avatars"><span>🌱</span><span>🍊</span><span>🥬</span></div><span><strong>Grown with care</strong><small>By local Sri Lankan farmers</small></span></div></div>
      <div className="hero-art" aria-label="Fresh harvest illustration"><div className="hero-circle circle-one" /><div className="hero-circle circle-two" /><div className="hero-note"><Leaf size={17} /> Picked at its best</div><div className="produce-emoji" aria-hidden="true"><span>🥬</span><span>🍊</span><span>🥑</span><span>🍅</span><span>🥕</span></div><div className="hero-sticker"><span>100%</span><small>GOOD<br />GROWING</small><Sprout size={19} /></div><div className="hero-caption"><span>THIS WEEK'S HARVEST</span><strong>Fresh from the garden</strong></div></div>
      <div className="hero-index"><span>01</span><span className="index-line" /><span>04</span></div>
    </section>
    <section className="value-strip"><div><Sprout /><span><strong>Locally grown</strong><small>Supporting our farmers</small></span></div><div><BadgeCheck /><span><strong>Picked with care</strong><small>Freshness comes first</small></span></div><div><Truck /><span><strong>At your doorstep</strong><small>Delivered fresh to you</small></span></div><div><Leaf /><span><strong>Good for the planet</strong><small>Thoughtful choices</small></span></div></section>
    <section className="section section-products"><SectionHeading eyebrow="THE GOOD STUFF" title="A fresh pick for you" text="Discover what’s in season and bring a little farm-fresh goodness home." action={<Link to="/shop" className="text-link">Explore all produce <ArrowRight size={16} /></Link>} /><ProductGrid products={products.slice(0, 4)} /></section>
    <section className="box-promo"><div className="promo-art"><span>🍋</span><span>🥬</span><span>🍅</span><div className="promo-badge">A box<br />of good</div></div><div className="promo-copy"><span className="eyebrow">A LITTLE BIT OF EVERYTHING</span><h2>Meet your new<br />favourite <em>box.</em></h2><p>Hand-picked bundles for busy weeks, family dinners, and everything in between.</p><Link className="button button-dark" to="/packages">Find your FreshBox <ArrowRight size={16} /></Link></div></section>
    <section className="section"><SectionHeading eyebrow="MADE FOR YOUR TABLE" title="A box for every kind of day" action={<Link to="/packages" className="text-link">See all boxes <ArrowRight size={16} /></Link>} /><PackageGrid packages={packages.slice(0, 3)} /></section>
    <section className="farmer-banner"><div className="farmer-art"><span>👩🏽‍🌾</span><div className="sun-shape" /><div className="farmer-basket">🥭 🥬 🍌</div></div><div><span className="eyebrow eyebrow-light">GROWN WITH HEART</span><h2>Behind every<br />good box is a<br /><em>good grower.</em></h2><p>We work with local growers who know the land, love what they do, and bring the very best of the season to your table.</p><Link className="text-link text-link-light" to="/about">Get to know our growers <ArrowRight size={16} /></Link></div><div className="farmer-deco">GROW<br />LOCAL</div></section>
    <section className="newsletter"><div><span className="eyebrow">A FRESH NOTE FROM US</span><h2>Good things grow<br />in your inbox.</h2><p>Seasonal picks, fresh ideas, and little notes from the farm.</p></div><form onSubmit={(event) => { event.preventDefault(); window.alert("Thanks for joining the FreshBox list!"); }}><label htmlFor="newsletter-email">Your email address</label><div className="newsletter-input"><input id="newsletter-email" type="email" placeholder="you@example.com" required /><button className="button button-dark" type="submit">Count me in <ArrowRight size={16} /></button></div><small>No spam, just the good stuff.</small></form></section>
  </>;
}

function ProductGrid({ products }) {
  if (!products.length) return <div className="empty-products"><div>🥬</div><h3>Fresh picks coming soon</h3><p>Our farmers are getting the next harvest ready. Check back shortly.</p><Link to="/contact" className="text-link">Get in touch <ArrowRight size={16} /></Link></div>;
  return <div className="product-grid">{products.map((product, index) => <ProductCard key={product._id} product={product} index={index} />)}</div>;
}

function ProductCard({ product, index = 0 }) {
  const [added, setAdded] = useState(false);
  const { user } = useAuth();
  async function add() {
    if (!user) return window.location.assign("/login");
    try {
      await api("/cart/items", { method: "POST", body: jsonBody({ itemId: product._id, itemType: "product", quantity: 1 }) });
      cartChanged();
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (error) { window.alert(error.message); }
  }
  return <article className="product-card">
    <Link to={`/products/${product._id}`} className={`product-image product-tone-${index % 4}`}>
      {imageFor(product) ? <img src={imageFor(product)} alt={product.name} loading="lazy" /> : <span className="product-emoji" aria-hidden="true">{["🥑", "🍊", "🥕", "🥬"][index % 4]}</span>}
      {product.isOrganic && <span className="product-tag">ORGANIC</span>}
      <span className="quick-view">View details <ArrowUpRight size={14} /></span>
    </Link>
    <div className="product-info"><div><span className="product-category">{product.category?.name || "FRESH PRODUCE"}</span><Link to={`/products/${product._id}`}><h3>{product.name}</h3></Link><p>{product.unit ? `Per ${product.unit}` : "Fresh from our farmers"}</p></div><div className="product-bottom"><strong>{money(product.salePrice ?? product.price)}</strong><button className={added ? "add-button added" : "add-button"} onClick={add} aria-label={`Add ${product.name} to cart`}>{added ? "Added" : <Plus size={19} />}</button></div></div>
  </article>;
}

function PackageGrid({ packages }) {
  if (!packages.length) return <div className="empty-products"><div>🍋</div><h3>FreshBox bundles are on their way</h3><p>Our team is getting the next seasonal boxes ready.</p><Link to="/contact" className="text-link">Ask us about custom boxes <ArrowRight size={16} /></Link></div>;
  return <div className="package-grid">{packages.map((item, index) => <PackageCard item={item} index={index} key={item._id} />)}</div>;
}

function PackageCard({ item, index }) {
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  async function addPackage() {
    if (!user) return window.location.assign("/login");
    try {
      await api("/cart/items", { method: "POST", body: jsonBody({ itemId: item._id, itemType: "package", quantity: 1 }) });
      cartChanged();
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (error) { window.alert(error.message); }
  }
  return <article className={`package-card package-${index % 3}`}><div className="package-image">{item.image ? <img src={item.image} alt={item.name} /> : <span aria-hidden="true">{["🍋", "🥑", "🍅"][index % 3]}</span>}<div className="package-stamp"><Leaf size={14} /> FARM FRESH</div></div><div className="package-details"><div className="package-title"><h3>{item.name}</h3><strong>{money(item.price)}</strong></div><p>{item.description}</p><button className={added ? "text-button package-added" : "text-button package-add"} onClick={addPackage}>{added ? "Added to your bag" : "Add this box to bag"} <ArrowRight size={15} /></button></div></article>;
}

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");
  useEffect(() => { api("/categories").then(setCategories).catch(() => {}); }, []);
  useEffect(() => {
    const params = new URLSearchParams({ sort });
    if (term) params.set("search", term);
    if (category) params.set("category", category);
    api(`/products?${params}`).then(setProducts).catch((err) => setError(err.message));
  }, [term, category, sort]);
  return <div className="page-container shop-page"><div className="page-hero"><span className="eyebrow">STRAIGHT FROM THE GROWERS</span><h1>Shop the <em>harvest.</em></h1><p>Good, seasonal produce picked fresh and ready for your table.</p></div><div className="shop-tools"><form className="search-field" onSubmit={(event) => { event.preventDefault(); setTerm(search); }}><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find something fresh…" aria-label="Search products" /><button type="submit">Search</button></form><div className="filter-fields"><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All produce</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Latest picks</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="popular">Popular</option></select></div></div>{error ? <ErrorState message={error} /> : <ProductGrid products={products} />}</div>;
}

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { user } = useAuth();
  useEffect(() => { api(`/products/${id}`).then(setProduct).catch((err) => setError(err.message)); }, [id]);
  async function add() {
    if (!user) return window.location.assign("/login");
    try {
      await api("/cart/items", { method: "POST", body: jsonBody({ itemId: product._id, itemType: "product", quantity: 1 }) });
      cartChanged();
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) { setError(err.message); }
  }
  if (error) return <div className="page-container"><ErrorState message={error} /></div>;
  if (!product) return <div className="page-loading"><span className="loader" />Loading product…</div>;
  return <div className="page-container detail-page"><div className="detail-image">{imageFor(product) ? <img src={imageFor(product)} alt={product.name} /> : <span>🥬</span>}</div><div className="detail-copy"><span className="eyebrow">{product.category?.name || "FRESH FROM THE FARM"}</span><h1>{product.name}</h1><p>{product.description || "Freshly picked by our local growers and packed with care, ready for your table."}</p><div className="detail-price">{money(product.salePrice ?? product.price)} <small>/ {product.unit || "item"}</small></div><p className={product.stock > 0 ? "stock-available" : "stock-unavailable"}>{product.stock > 0 ? `${product.stock} available` : "Currently unavailable"}</p><button className="button button-dark button-wide" onClick={add} disabled={product.stock < 1}>{added ? "Added to your bag" : "Add to bag"} <ShoppingBag size={18} /></button><div className="detail-benefits"><span><Sprout size={17} /> Locally grown</span><span><PackageCheck size={17} /> Carefully packed</span><span><Truck size={17} /> Home delivery</span></div></div></div>;
}

function PackagesPage() {
  const [packages, setPackages] = useState([]);
  useEffect(() => { api("/packages").then(setPackages).catch(() => {}); }, []);
  return <div className="page-container"><div className="page-hero"><span className="eyebrow">A BOX FULL OF GOODNESS</span><h1>Meet your <em>FreshBox.</em></h1><p>Thoughtful seasonal bundles made for the way you eat.</p></div><PackageGrid packages={packages} /><div className="custom-box-cta"><div><span className="eyebrow">MAKE IT YOURS</span><h2>Your box, your way.</h2><p>Looking for something custom? Tell us what you have in mind and our team will help.</p></div><Link to="/contact" className="button button-dark">Request a custom box <ArrowRight size={16} /></Link></div></div>;
}

function InfoPage({ title, eyebrow, text }) {
  return <div className="info-page"><div className="info-leaf">🌿</div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p><Link to="/shop" className="button button-dark">Explore the harvest <ArrowRight size={16} /></Link></div>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  return <div className="page-container contact-layout"><div><span className="eyebrow">WE’RE HERE TO HELP</span><h1>Say <em>hello.</em></h1><p>Questions about an order, delivery, or just want to talk produce? We’d love to hear from you.</p><div className="contact-detail"><span><CircleHelp /></span><div><strong>Customer care</strong><p>hello@freshbox.lk</p></div></div><div className="contact-detail"><span><Clock3 /></span><div><strong>We’re around</strong><p>Monday–Saturday, 8am–5pm</p></div></div></div><form className="form-card" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><h2>Send us a note</h2>{sent && <div className="notice-success">Thanks for reaching out. We’ll be in touch soon.</div>}<label>Your name<input required name="name" placeholder="How should we call you?" /></label><label>Email address<input required type="email" name="email" placeholder="you@example.com" /></label><label>What can we help with?<select name="topic"><option>Order question</option><option>Delivery information</option><option>FreshBox packages</option><option>Something else</option></select></label><label>Your message<textarea required name="message" rows="4" placeholder="Tell us a little more…" /></label><button className="button button-dark" type="submit">Send message <ArrowRight size={16} /></button><small>This form is a UI placeholder. Configure an email provider to receive messages.</small></form></div>;
}

function FaqPage() {
  const questions = [
    ["Where does your produce come from?", "We partner with local Sri Lankan growers and bring together seasonal produce picked with care."],
    ["How do deliveries work?", "Available delivery areas and delivery slots are shown during checkout. Coverage and fees are managed by the FreshBox team."],
    ["Can I customize a FreshBox?", "We’re happy to help with custom requests. Contact our team and let us know what you’re looking for."],
    ["What payment methods can I use?", "Cash on Delivery is the initial configured payment method. Other payment providers can be integrated once selected."],
    ["Can I set up recurring deliveries?", "Subscriptions are available for eligible FreshBoxes. You can pause, resume, or cancel from your account."]
  ];
  return <div className="page-container faq-page"><div className="page-hero"><span className="eyebrow">A FEW FRESH ANSWERS</span><h1>Good to <em>know.</em></h1><p>Everything you need to make your FreshBox experience easy.</p></div><div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div><div className="faq-contact"><span>Still have a question?</span><Link to="/contact" className="text-link">Talk to our team <ArrowRight size={16} /></Link></div></div>;
}

function AuthPage({ register = false }) {
  const { user, signIn, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === "admin" || user.role === "staff" ? "/admin" : "/account"} replace />;
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const details = Object.fromEntries(data.entries());
    try {
      const loggedIn = register ? await createAccount(details) : await signIn(details);
      navigate(loggedIn.role === "admin" || loggedIn.role === "staff" ? "/admin" : "/account");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-art"><span>🥑</span><span>🍊</span><span>🥬</span><div><Sprout size={22} /> A fresh start begins here.</div></div><div className="auth-form-wrap"><span className="eyebrow">{register ? "YOUR FRESHBOX JOURNEY" : "WELCOME BACK"}</span><h1>{register ? <>Let’s get<br /><em>growing.</em></> : <>Good to<br /><em>see you.</em></>}</h1><p>{register ? "Create your account and bring the good stuff home." : "Sign in to pick up where you left off."}</p><form className="auth-form" onSubmit={submit}>{register && <label>Your name<input name="name" required minLength="2" autoComplete="name" placeholder="Full name" /></label>}<label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com" /></label>{register && <label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="+94 77 123 4567" /></label>}<label>Password<input name="password" required type="password" minLength="8" autoComplete={register ? "new-password" : "current-password"} placeholder="At least 8 characters" /></label>{error && <div className="notice-error" role="alert">{error}</div>}<button className="button button-dark button-wide" disabled={busy}>{busy ? "One moment…" : register ? "Create account" : "Sign in"} <ArrowRight size={17} /></button></form><p className="auth-switch">{register ? "Already have an account?" : "New to FreshBox?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></p></div></div>;
}

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const load = () => api("/cart").then(setCart).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  async function update(line, quantity) {
    try { await api(`/cart/items/${line._id}`, { method: "PATCH", body: jsonBody({ quantity }) }); cartChanged(); await load(); }
    catch (err) { setError(err.message); }
  }
  const items = cart?.items || [];
  const subtotal = items.reduce((sum, line) => {
    const item = line.product || line.package;
    return sum + (item?.salePrice ?? item?.price ?? 0) * line.quantity;
  }, 0);
  if (error) return <div className="page-container"><ErrorState message={error} /></div>;
  if (!cart) return <div className="page-loading"><span className="loader" />Loading your bag…</div>;
  return <div className="page-container cart-page"><div className="page-hero compact"><span className="eyebrow">YOUR GOODNESS, GATHERED</span><h1>Your <em>bag.</em></h1></div>{items.length ? <div className="cart-layout"><div className="cart-items">{items.map((line) => { const item = line.product || line.package; return <article className="cart-line" key={line._id}><div className="cart-thumb">{item?.images?.[0] ? <img src={item.images[0]} alt="" /> : <span>🥬</span>}</div><div className="cart-line-info"><Link to={line.product ? `/products/${item?._id}` : "/packages"}><h3>{item?.name || "Unavailable item"}</h3></Link><p>{line.product ? `Per ${item?.unit || "item"}` : "FreshBox package"}</p><strong>{money(item?.salePrice ?? item?.price)}</strong></div><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => update(line, line.quantity - 1)}><span>−</span></button><span>{line.quantity}</span><button aria-label="Increase quantity" onClick={() => update(line, line.quantity + 1)}><Plus size={14} /></button></div></article>; })}<Link to="/shop" className="text-link">Continue shopping <ArrowRight size={15} /></Link></div><aside className="cart-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Estimated total</span><strong>{money(subtotal)}</strong></div><Link to="/checkout" className="button button-dark button-wide">Continue to checkout <ArrowRight size={17} /></Link><p><ShieldCheck size={15} /> Your order total is calculated securely.</p></aside></div> : <div className="cart-empty"><div>🧺</div><h2>Your bag is taking a breather.</h2><p>When you find something fresh, it’ll be right here.</p><Link to="/shop" className="button button-dark">Explore the harvest <ArrowRight size={16} /></Link></div>}</div>;
}

function CheckoutPage() {
  const { user, setUser } = useAuth();
  const [cart, setCart] = useState(null);
  const [areas, setAreas] = useState([]);
  const [slots, setSlots] = useState([]);
  const [addressChoice, setAddressChoice] = useState(user.addresses?.[0]?._id || "new");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    api("/cart").then(setCart).catch((err) => setError(err.message));
    api("/delivery/areas").then(setAreas).catch((err) => setError(err.message));
  }, []);
  const subtotal = cart?.items?.reduce((sum, line) => {
    const item = line.product || line.package;
    return sum + (item?.salePrice ?? item?.price ?? 0) * line.quantity;
  }, 0) || 0;
  async function addAddress(data) {
    const address = await api("/users/me/addresses", { method: "POST", body: jsonBody({ ...data, addressLines: [data.addressLine] }) });
    const updatedUser = { ...user, addresses: [...(user.addresses || []), address] };
    setUser(updatedUser);
    return address._id;
  }
  async function changeDate(date) {
    try { setSlots(await api(`/delivery/slots?date=${encodeURIComponent(date)}`)); }
    catch (err) { setError(err.message); }
  }
  async function applyCoupon() {
    setCouponMessage("");
    setDiscount(0);
    if (!couponCode.trim()) return setCouponMessage("Enter a coupon code first.");
    try {
      const result = await api("/coupons/validate", { method: "POST", body: jsonBody({ code: couponCode, subtotal }) });
      setDiscount(result.discount);
      setCouponMessage(`${result.code} applied — ${money(result.discount)} off.`);
    } catch (err) { setCouponMessage(err.message); }
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      let addressId = data.get("addressId");
      if (addressId === "new") addressId = await addAddress(Object.fromEntries(data.entries()));
      const order = await api("/orders", { method: "POST", body: jsonBody({ addressId, deliverySlotId: data.get("deliverySlotId"), couponCode: couponCode || undefined, instructions: data.get("instructions") }) });
      cartChanged();
      navigate(`/orders/${order._id}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  if (!cart) return <div className="page-loading"><span className="loader" />Preparing checkout…</div>;
  if (!cart.items?.length) return <div className="page-container cart-empty"><h2>Your bag is empty.</h2><Link to="/shop" className="button button-dark">Shop the harvest</Link></div>;
  const canUseNewAddress = areas.length > 0;
  return <div className="page-container checkout-page"><div className="page-hero compact"><span className="eyebrow">ALMOST AT YOUR DOOR</span><h1>Let’s get it <em>to you.</em></h1></div><form className="checkout-layout" onSubmit={submit}><div className="checkout-form">
    <section className="checkout-section"><div className="checkout-title"><span>01</span><div><h2>Delivery address</h2><p>Where should we bring your FreshBox?</p></div></div>{user.addresses?.length > 0 && <div className="address-options">{user.addresses.map((address) => <label className="address-card" key={address._id}><input type="radio" name="addressId" value={address._id} checked={addressChoice === address._id} onChange={() => setAddressChoice(address._id)} /><span><strong>{address.recipientName}</strong><small>{address.addressLines.join(", ")}, {address.city}, {address.district}</small></span></label>)}{canUseNewAddress && <label className="address-card"><input type="radio" name="addressId" value="new" checked={addressChoice === "new"} onChange={() => setAddressChoice("new")} /><span><strong>Use a new address</strong><small>Add a delivery address</small></span></label>}</div>}{!user.addresses?.length && <input type="hidden" name="addressId" value="new" />}{addressChoice === "new" && <div className="address-form"><label>Recipient name<input name="recipientName" autoComplete="name" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required /></label><label className="field-full">Address<input name="addressLine" autoComplete="street-address" required /></label><label>City<input name="city" autoComplete="address-level2" required /></label><label>District<select name="district" required><option value="">Select district</option>{areas.flatMap((area) => area.districts || []).filter((item, index, list) => list.indexOf(item) === index).map((district) => <option key={district}>{district}</option>)}</select></label></div>}</section>
    <section className="checkout-section"><div className="checkout-title"><span>02</span><div><h2>Delivery date & time</h2><p>Choose an available delivery slot.</p></div></div><div className="address-form"><label>Delivery date<input type="date" name="deliveryDate" required min={new Date().toISOString().slice(0, 10)} onChange={(event) => changeDate(event.target.value)} /></label><label>Delivery slot<select name="deliverySlotId" required><option value="">Select a date first</option>{slots.map((slot) => <option value={slot._id} key={slot._id}>{slot.startTime} – {slot.endTime}</option>)}</select></label><label className="field-full">Delivery instructions<textarea name="instructions" rows="2" placeholder="A helpful note for your delivery…" /></label></div></section>
    <section className="checkout-section"><div className="checkout-title"><span>03</span><div><h2>Payment</h2><p>Pay your way, at your door.</p></div></div><label className="payment-option"><input type="radio" checked readOnly /><span><strong>Cash on Delivery</strong><small>Pay when your FreshBox arrives</small></span><span className="cod-chip">COD</span></label></section>
    {error && <div className="notice-error" role="alert">{error}</div>}<button className="button button-dark button-wide" disabled={busy || areas.length === 0}>{busy ? "Placing your order…" : "Place order"} <ArrowRight size={17} /></button>{areas.length === 0 && <p className="form-note">Delivery service areas haven’t been configured yet. Please contact FreshBox.</p>}
  </div><aside className="cart-summary checkout-summary"><h2>Your FreshBox</h2>{cart.items.map((line) => <div className="checkout-item" key={line._id}><span>{(line.product || line.package)?.name} × {line.quantity}</span><strong>{money(((line.product || line.package)?.salePrice ?? (line.product || line.package)?.price) * line.quantity)}</strong></div>)}<div className="coupon-entry"><label htmlFor="coupon-code">Have a coupon?</label><div><input id="coupon-code" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter code" /><button type="button" onClick={applyCoupon}>Apply</button></div>{couponMessage && <small>{couponMessage}</small>}</div><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>{discount > 0 && <div><span>Discount</span><strong>− {money(discount)}</strong></div>}<div><span>Delivery fee</span><span>Confirmed by area</span></div><div className="summary-total"><span>Before delivery</span><strong>{money(subtotal - discount)}</strong></div><p><LockKeyhole size={15} /> Final delivery fee is calculated by your delivery area.</p></aside></form></div>;
}

function AccountPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  useEffect(() => {
    api("/orders/my").then(setOrders).catch(() => {});
    api("/subscriptions/my").then(setSubscriptions).catch(() => {});
  }, []);
  return <div className="page-container account-page"><div className="page-hero compact"><span className="eyebrow">YOUR FRESHBOX HOME</span><h1>Hello, <em>{user.name.split(" ")[0]}.</em></h1><p>Everything you need for a fresh week, all in one place.</p></div><div className="account-shortcuts"><Link to="/orders" onClick={(event) => { event.preventDefault(); document.getElementById("orders")?.scrollIntoView({ behavior: "smooth" }); }}><ShoppingBag /><strong>My orders</strong><span>{orders.length} orders <ArrowRight size={15} /></span></Link><Link to="/subscriptions"><Clock3 /><strong>Subscriptions</strong><span>{subscriptions.length} plans <ArrowRight size={15} /></span></Link><Link to="/support"><CircleHelp /><strong>Need a hand?</strong><span>Contact support <ArrowRight size={15} /></span></Link><div><UserRound /><strong>Your details</strong><span>{user.email}</span></div></div><AddressBook /><div id="orders" className="account-section"><SectionHeading eyebrow="THE JOURNEY SO FAR" title="Recent orders" action={<Link to="/shop" className="text-link">Shop again <ArrowRight size={16} /></Link>} />{orders.length ? <div className="order-list">{orders.slice(0, 6).map((order) => <Link to={`/orders/${order._id}`} className="order-row" key={order._id}><span className="order-icon"><PackageCheck /></span><span><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} items</small></span><span className={`status-pill status-${order.orderStatus}`}>{order.orderStatus.replaceAll("_", " ")}</span><strong>{money(order.totals.total)}</strong><ChevronRight size={17} /></Link>)}</div> : <div className="account-empty"><p>Your first FreshBox order is waiting to happen.</p><Link to="/shop" className="text-link">Find a fresh pick <ArrowRight size={16} /></Link></div>}</div></div>;
}

function AddressBook() {
  const { user, setUser } = useAuth();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  async function addAddress(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    try {
      const address = await api("/users/me/addresses", { method: "POST", body: jsonBody({ recipientName: form.recipientName, phone: form.phone, addressLines: [form.addressLine], city: form.city, district: form.district, postalCode: form.postalCode }) });
      setUser({ ...user, addresses: [...(user.addresses || []), address] });
      formElement.reset();
      setAdding(false);
      setError("");
    } catch (err) { setError(err.message); }
  }
  async function removeAddress(address) {
    try {
      await api(`/users/me/addresses/${address._id}`, { method: "DELETE" });
      setUser({ ...user, addresses: user.addresses.filter((item) => item._id !== address._id) });
    } catch (err) { setError(err.message); }
  }
  return <section className="address-book"><div className="panel-title"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Saved addresses</h2></div><button className="text-button" onClick={() => setAdding(!adding)}>{adding ? "Close" : "+ Add address"}</button></div>{error && <div className="notice-error">{error}</div>}{adding && <form className="address-form address-book-form" onSubmit={addAddress}><label>Recipient name<input name="recipientName" required /></label><label>Phone<input name="phone" type="tel" required /></label><label className="field-full">Address<input name="addressLine" required /></label><label>City<input name="city" required /></label><label>District<input name="district" required /></label><label>Postal code<input name="postalCode" /></label><button className="button button-dark">Save address <ArrowRight size={16} /></button></form>}{user.addresses?.length ? <div className="saved-addresses">{user.addresses.map((address) => <article key={address._id}><div><strong>{address.recipientName}</strong><p>{address.addressLines.join(", ")}, {address.city}, {address.district}{address.postalCode ? ` ${address.postalCode}` : ""}</p><small>{address.phone}</small></div><button className="text-button danger-text" onClick={() => removeAddress(address)}>Remove</button></article>)}</div> : <p className="address-empty">Save an address to make your next delivery easier.</p>}</section>;
}

function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api(`/orders/${id}`).then(setOrder).catch((err) => setError(err.message)); }, [id]);
  if (error) return <div className="page-container"><ErrorState message={error} /></div>;
  if (!order) return <div className="page-loading"><span className="loader" />Loading order…</div>;
  const steps = ["pending_confirmation", "confirmed", "preparing", "packed", "out_for_delivery", "delivered"];
  const current = steps.indexOf(order.orderStatus);
  return <div className="page-container order-detail"><Link to="/account" className="back-link">← Back to your account</Link><div className="order-thanks"><span className="success-check"><PackageCheck /></span><span className="eyebrow">ORDER RECEIVED</span><h1>Good things are <em>on their way.</em></h1><p>Order <strong>{order.orderNumber}</strong> · {new Date(order.createdAt).toLocaleDateString()}</p></div><div className="tracking-card"><h2>Order journey</h2>{order.orderStatus === "cancelled" ? <div className="notice-error">This order has been cancelled.</div> : <div className="tracking-steps">{steps.map((step, index) => <div className={index <= current ? "tracking-step active" : "tracking-step"} key={step}><span>{index < current ? <BadgeCheck size={18} /> : index + 1}</span><small>{step.replaceAll("_", " ")}</small></div>)}</div>}<div className="tracking-meta"><span><strong>Delivery to</strong>{order.addressSnapshot.addressLines.join(", ")}, {order.addressSnapshot.city}</span><span><strong>Payment</strong>Cash on Delivery</span><span><strong>Total</strong>{money(order.totals.total)}</span></div></div><div className="tracking-card order-items"><h2>In your order</h2>{order.items.map((item, index) => <div key={`${item.itemId}-${index}`}><span>{item.name} × {item.quantity}</span><strong>{money(item.lineTotal)}</strong></div>)}</div></div>;
}

function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [packs, setPacks] = useState([]);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const load = () => api("/subscriptions/my").then(setSubs).catch((err) => setError(err.message));
  useEffect(() => { load(); api("/packages").then(setPacks).catch(() => {}); }, []);
  async function create(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement));
    try {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      await api("/subscriptions", { method: "POST", body: jsonBody({ ...data, packageId: data.packageId, startDate: nextDate.toISOString(), addressId: user.addresses?.[0]?._id }) });
      await load();
      formElement.reset();
    } catch (err) { setError(err.message); }
  }
  async function action(id, actionName) {
    try { await api(`/subscriptions/${id}/${actionName}`, { method: actionName === "skip" ? "POST" : "PATCH" }); await load(); }
    catch (err) { setError(err.message); }
  }
  return <div className="page-container"><div className="page-hero compact"><span className="eyebrow">FRESHNESS, ON REPEAT</span><h1>Your <em>subscriptions.</em></h1><p>Keep a little goodness coming, on your schedule.</p></div>{error && <div className="notice-error">{error}</div>}{user.addresses?.length ? <form className="subscription-create" onSubmit={create}><h2>Start a fresh routine</h2><select name="packageId" required><option value="">Choose a FreshBox</option>{packs.map((pack) => <option key={pack._id} value={pack._id}>{pack.name} — {money(pack.price)}</option>)}</select><select name="frequency"><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><button className="button button-dark">Start subscription <ArrowRight size={16} /></button></form> : <div className="notice-info">Add a delivery address to your account before starting a subscription.</div>}<div className="subscription-list">{subs.map((sub) => <article className="subscription-card" key={sub._id}><div className="subscription-icon">🌿</div><div><h3>{sub.package?.name || "FreshBox"}</h3><p>{sub.frequency} · Next delivery {new Date(sub.nextDeliveryDate).toLocaleDateString()}</p></div><span className={`status-pill status-${sub.status}`}>{sub.status}</span><div>{sub.status === "active" ? <><button className="text-button" onClick={() => action(sub._id, "skip")}>Skip next</button><button className="text-button" onClick={() => action(sub._id, "pause")}>Pause</button></> : sub.status === "paused" ? <button className="text-button" onClick={() => action(sub._id, "resume")}>Resume</button> : null}{sub.status !== "cancelled" && <button className="text-button danger-text" onClick={() => action(sub._id, "cancel")}>Cancel</button>}</div></article>)}{!subs.length && <div className="cart-empty"><div>🌱</div><h2>A fresh routine starts here.</h2><p>Choose a FreshBox above and we’ll help keep the good stuff coming.</p></div>}</div></div>;
}

function SupportPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const input = Object.fromEntries(new FormData(formElement));
    try {
      await api("/support", { method: "POST", body: jsonBody(input) });
      setSent(true);
      formElement.reset();
    } catch (err) { setError(err.message); }
  }
  return <div className="page-container support-page"><div className="page-hero compact"><span className="eyebrow">WE’RE HERE FOR YOU</span><h1>How can we <em>help?</em></h1></div><form className="form-card support-form" onSubmit={submit}><h2>Send a support request</h2>{sent && <div className="notice-success">Your request is with our team. We’ll be in touch.</div>}{error && <div className="notice-error">{error}</div>}<label>Subject<input name="subject" required minLength="3" maxLength="160" placeholder="A quick summary" /></label><label>How can we help?<textarea name="message" required minLength="10" rows="6" placeholder="Share a few details so we can help…" /></label><button className="button button-dark">Send request <ArrowRight size={16} /></button></form></div>;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && ["admin", "staff"].includes(user.role) ? children : <Navigate to="/account" replace />;
}

function AdminPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [section, setSection] = useState(user.role === "admin" ? "overview" : "orders");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = () => {
    const requests = [
      api("/admin/orders").then(setOrders),
      api(user.role === "admin" ? "/admin/products" : "/products").then(setProducts),
      api("/admin/inventory").then(setInventory),
      api("/categories").then(setCategories)
    ];
    if (user.role === "admin") requests.push(api("/admin/dashboard/summary").then(setSummary));
    return Promise.all(requests).catch((err) => setError(err.message));
  };
  useEffect(() => { load(); }, []);

  async function updateStatus(order, status) {
    try {
      await api(`/admin/orders/${order._id}/status`, { method: "PATCH", body: jsonBody({ status }) });
      setNotice(`Order ${order.orderNumber} updated.`);
      await load();
    } catch (err) { setError(err.message); }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError(""); setNotice(""); setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const image = form.get("image");
      let images = editingProduct?.images || [];
      if (image instanceof File && image.size > 0) {
        if (image.size > 5 * 1024 * 1024) throw new Error("Choose an image smaller than 5 MB.");
        const uploaded = await api("/admin/uploads", { method: "POST", headers: { "Content-Type": image.type }, body: image });
        images = [new URL(uploaded.url, API_ORIGIN).toString()];
      }
      const input = {
        name: form.get("name"),
        sku: form.get("sku"),
        category: form.get("category"),
        description: form.get("description"),
        price: Number(form.get("price")),
        unit: form.get("unit"),
        isOrganic: form.get("isOrganic") === "on",
        images
      };
      if (!editingProduct) input.stock = Number(form.get("stock"));
      await api(editingProduct ? `/admin/products/${editingProduct._id}` : "/admin/products", {
        method: editingProduct ? "PATCH" : "POST",
        body: jsonBody(input)
      });
      setNotice(editingProduct ? "Product updated." : "Product added to the catalogue.");
      setEditingProduct(null);
      formElement.reset();
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function archiveProduct(product) {
    if (!window.confirm(`Delete "${product.name}" from the active catalogue? It will be archived so past orders remain intact.`)) return;
    try {
      await api(`/admin/products/${product._id}`, { method: "DELETE" });
      setNotice("Product archived and removed from the active catalogue.");
      if (editingProduct?._id === product._id) setEditingProduct(null);
      await load();
    } catch (err) { setError(err.message); }
  }

  async function restoreProduct(product) {
    try {
      await api(`/admin/products/${product._id}`, { method: "PATCH", body: jsonBody({ isActive: true }) });
      setNotice("Product restored to the active catalogue.");
      await load();
    } catch (err) { setError(err.message); }
  }

  async function createCategory(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    try {
      await api("/admin/categories", { method: "POST", body: jsonBody({ name: form.name, slug: form.slug }) });
      setNotice("Category created.");
      formElement.reset();
      await load();
    } catch (err) { setError(err.message); }
  }

  async function adjustStock(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const input = Object.fromEntries(new FormData(formElement));
    try {
      await api("/admin/stock/adjust", { method: "POST", body: jsonBody({ productId: input.productId, quantity: Number(input.quantity), reason: input.reason }) });
      setNotice("Inventory updated.");
      formElement.reset();
      await load();
    } catch (err) { setError(err.message); }
  }

  const links = [
    ["overview", BarChart3, "Overview"], ["products", Sprout, "Products"], ["orders", ShoppingBag, "Orders"],
    ["inventory", PackageCheck, "Inventory"], ["packages", Leaf, "Packages"], ["subscriptions", Clock3, "Subscriptions"],
    ["suppliers", Truck, "Suppliers"], ["delivery", Truck, "Delivery"], ["coupons", BadgeCheck, "Coupons"],
    ["customers", UserRound, "Customers"], ["reports", BarChart3, "Reports"], ["reviews", BadgeCheck, "Reviews"], ["support", CircleHelp, "Support"]
  ];
  const visibleLinks = user.role === "admin" ? links : links.filter(([key]) => ["orders", "inventory", "subscriptions", "suppliers", "support"].includes(key));

  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-title"><span className="brand-icon"><Sprout size={22} /></span><span>FreshBox<small>OPERATIONS</small></span></div><div className="admin-nav">{visibleLinks.map(([key, Icon, text]) => <button key={key} className={section === key ? "admin-nav-item selected" : "admin-nav-item"} onClick={() => setSection(key)}><Icon size={18} />{text}{key === "orders" && orders.filter((item) => item.orderStatus === "pending_confirmation").length > 0 && <i>{orders.filter((item) => item.orderStatus === "pending_confirmation").length}</i>}</button>)}</div><div className="admin-sidebar-foot"><span className="admin-avatar">{user.name[0]}</span><span>{user.name}<small>{user.role}</small></span></div></aside><div className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">FRESHBOX OPERATIONS</span><h1>{links.find(([key]) => key === section)?.[2] || section}</h1></div><Link to="/" className="text-link">View storefront <ArrowUpRight size={16} /></Link></header><div className="admin-content">{error && <div className="notice-error" role="alert">{error}<button onClick={() => setError("")}><X size={15} /></button></div>}{notice && <div className="notice-success">{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}
    {section === "overview" && <><div className="stats-grid">{[["Total sales", money(summary?.sales), BarChart3, "All time"], ["Orders", summary?.orders ?? "—", ShoppingBag, "All orders"], ["Customers", summary?.customers ?? "—", UserRound, "Registered"], ["Active products", summary?.products ?? "—", Sprout, "In catalogue"]].map(([label, value, Icon, note]) => <div className="stat-card" key={label}><div className="stat-heading"><span>{label}</span><Icon size={19} /></div><strong>{value}</strong><small>{note}</small></div>)}</div><div className="admin-panel"><div className="panel-title"><div><span className="eyebrow">NEEDS YOUR ATTENTION</span><h2>Recent orders</h2></div><button className="text-link" onClick={() => setSection("orders")}>All orders <ArrowRight size={15} /></button></div><OrderTable orders={orders.slice(0, 6)} onUpdate={updateStatus} /></div></>}
    {section === "orders" && <div className="admin-panel"><div className="panel-title"><div><span className="eyebrow">ORDER MANAGEMENT</span><h2>Customer orders</h2></div></div><OrderTable orders={orders} onUpdate={updateStatus} /></div>}
    {section === "products" && <><div className="admin-panel"><div className="panel-title"><div><span className="eyebrow">CATALOGUE</span><h2>{editingProduct ? "Edit product" : "Add a product"}</h2></div></div><form key={editingProduct?._id || "new-product"} className="admin-product-form" onSubmit={saveProduct}><label>Product name<input name="name" defaultValue={editingProduct?.name || ""} required /></label><label>SKU<input name="sku" defaultValue={editingProduct?.sku || ""} required /></label><label>Category<select name="category" defaultValue={editingProduct?.category?._id || editingProduct?.category || ""} required><option value="">Select category</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select></label><label>Description<input name="description" defaultValue={editingProduct?.description || ""} /></label><label>Price (LKR)<input name="price" type="number" min="0" step="0.01" defaultValue={editingProduct?.price ?? ""} required /></label>{!editingProduct && <label>Initial stock<input name="stock" type="number" min="0" required /></label>}<label>Unit<select name="unit" defaultValue={editingProduct?.unit || "item"}><option value="item">Item</option><option value="kg">Kg</option><option value="box">Box</option><option value="pack">Pack</option></select></label><label>Product photo<input name="image" type="file" accept="image/jpeg,image/png,image/webp" />{editingProduct?.images?.[0] && <img className="admin-product-image-preview" src={editingProduct.images[0]} alt={`Current photo of ${editingProduct.name}`} />}</label><label className="checkbox-field"><input name="isOrganic" type="checkbox" defaultChecked={editingProduct?.isOrganic || false} /> Organic produce</label><button className="button button-dark" disabled={busy}>{busy ? "Saving…" : editingProduct ? "Save changes" : "Add product"} <Plus size={16} /></button>{editingProduct && <button className="button button-light" type="button" onClick={() => setEditingProduct(null)}>Cancel</button>}</form><small>JPEG, PNG, or WebP; maximum file size 5 MB. Product photos are stored on this server.</small></div><div className="admin-panel"><div className="panel-title"><h2>Categories</h2></div><form className="admin-product-form" onSubmit={createCategory}><label>Category name<input name="name" required /></label><label>Slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="fresh-fruits" /></label><button className="button button-dark">Add category <Plus size={16} /></button></form><div className="category-chips">{categories.map((category) => <span key={category._id}>{category.name}</span>)}</div></div><div className="admin-panel"><h2>Product catalogue</h2><div className="simple-table product-admin-table"><div className="simple-row simple-head"><span>Product</span><span>SKU</span><span>Price</span><span>Stock</span><span>Status</span><span>Actions</span></div>{products.map((product) => <div className="simple-row" key={product._id}><strong className="admin-product-name">{product.images?.[0] && <img src={product.images[0]} alt="" />}{product.name}</strong><span>{product.sku}</span><span>{money(product.salePrice ?? product.price)}</span><span>{product.stock}</span><span className="status-pill">{product.isActive ? "Active" : "Archived"}</span><div className="product-admin-actions"><button type="button" onClick={() => { setEditingProduct(product); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>{product.isActive ? <button type="button" className="danger-action" onClick={() => archiveProduct(product)}>Delete</button> : <button type="button" onClick={() => restoreProduct(product)}>Restore</button>}</div></div>)}</div>{!products.length && <div className="table-empty">No products in the catalogue yet.</div>}<small>Deleted products are archived to keep existing order records intact.</small></div></>}
    {section === "inventory" && <>{user.role === "admin" && <div className="admin-panel"><div className="panel-title"><div><span className="eyebrow">STOCK MANAGEMENT</span><h2>Adjust stock</h2></div></div><form className="admin-product-form" onSubmit={adjustStock}><label>Product<select name="productId" required><option value="">Select product</option>{inventory.map((product) => <option key={product._id} value={product._id}>{product.name} — {product.stock} in stock</option>)}</select></label><label>Quantity change<input name="quantity" type="number" step="1" required placeholder="e.g. 10 or -2" /></label><label>Reason<input name="reason" required minLength="3" /></label><button className="button button-dark">Update stock <ArrowRight size={16} /></button></form></div>}<div className="admin-panel"><h2>Current inventory</h2><div className="simple-table"><div className="simple-row simple-head"><span>Product</span><span>SKU</span><span>Stock</span><span>Unit price</span><span>Availability</span></div>{inventory.map((item) => <div className="simple-row" key={item._id}><strong>{item.name}</strong><span>{item.sku}</span><span className={item.stock < 5 ? "low-stock" : ""}>{item.stock}</span><span>{money(item.salePrice ?? item.price)}</span><span className="status-pill">{item.stock ? "In stock" : "Out of stock"}</span></div>)}</div></div></>}
    {section === "packages" && <AdminPackages />}
    {section === "subscriptions" && <AdminSubscriptions />}
    {section === "suppliers" && <AdminSuppliers />}
    {section === "delivery" && <AdminDelivery />}
    {section === "coupons" && <AdminCoupons />}
    {section === "customers" && <AdminCustomers />}
    {section === "reports" && <AdminReports />}
    {section === "reviews" && <AdminReviews />}
    {section === "support" && <AdminSupport />}
  </div></div></div>;
}

function OrderTable({ orders, onUpdate }) {
  if (!orders.length) return <div className="table-empty">No orders to show yet.</div>;
  return <div className="simple-table order-table"><div className="simple-row simple-head"><span>Order</span><span>Customer</span><span>Date</span><span>Total</span><span>Status</span><span>Update</span></div>{orders.map((order) => <div className="simple-row" key={order._id}><strong>{order.orderNumber}</strong><span>{order.user?.name || "Customer"}</span><span>{new Date(order.createdAt).toLocaleDateString()}</span><strong>{money(order.totals.total)}</strong><span className={`status-pill status-${order.orderStatus}`}>{order.orderStatus.replaceAll("_", " ")}</span><select aria-label={`Update status for ${order.orderNumber}`} value={order.orderStatus} onChange={(event) => onUpdate(order, event.target.value)} disabled={["delivered", "cancelled"].includes(order.orderStatus)}>{["pending_confirmation", "confirmed", "preparing", "packed", "out_for_delivery", "delivered", "cancelled"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></div>)}</div>;
}

function AdminPackages() {
  const [packs, setPacks] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingPack, setEditingPack] = useState(null);
  const [includedItems, setIncludedItems] = useState([]);
  const [error, setError] = useState("");
  const load = () => api("/admin/packages").then(setPacks).catch((err) => setError(err.message));
  useEffect(() => { load(); api("/admin/products").then(setProducts).catch((err) => setError(err.message)); }, []);
  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement));
    setError("");
    try {
      await api(editingPack ? `/admin/packages/${editingPack._id}` : "/admin/packages", {
        method: editingPack ? "PATCH" : "POST",
        body: jsonBody({
          name: data.name,
          description: data.description,
          price: Number(data.price),
          packageType: data.packageType,
          includedItems: includedItems.map(({ product, quantity }) => ({ product, quantity: Number(quantity) }))
        })
      });
      setEditingPack(null);
      setIncludedItems([]);
      formElement.reset();
      await load();
    }
    catch (err) { setError(err.message); }
  }
  async function archivePack(pack) {
    if (!window.confirm(`Delete "${pack.name}" from the active packages? It will be archived so existing orders remain intact.`)) return;
    setError("");
    try {
      await api(`/admin/packages/${pack._id}`, { method: "DELETE" });
      if (editingPack?._id === pack._id) {
        setEditingPack(null);
        setIncludedItems([]);
      }
      await load();
    } catch (err) { setError(err.message); }
  }
  async function restorePack(pack) {
    setError("");
    try {
      await api(`/admin/packages/${pack._id}`, { method: "PATCH", body: jsonBody({ isActive: true }) });
      await load();
    } catch (err) { setError(err.message); }
  }
  return <div className="admin-panel"><span className="eyebrow">BOX BUILDER</span><h2>FreshBox packages</h2>{error && <p className="notice-error" role="alert">{error}</p>}<form key={editingPack?._id || "new-package"} className="admin-product-form" onSubmit={submit}><label>Box name<input name="name" defaultValue={editingPack?.name || ""} required /></label><label>Type<select name="packageType" defaultValue={editingPack?.packageType || "mini"}><option value="mini">Mini</option><option value="family">Family</option><option value="premium">Premium</option><option value="custom">Custom</option></select></label><label>Price<input name="price" type="number" min="0" step="0.01" defaultValue={editingPack?.price ?? ""} required /></label><label>Description<input name="description" defaultValue={editingPack?.description || ""} /></label><div className="package-items-editor"><div className="package-items-heading"><strong>Items included</strong><button className="button button-light" type="button" onClick={() => setIncludedItems((items) => [...items, { product: "", quantity: 1 }])}><Plus size={15} /> Add item</button></div>{includedItems.map((item, index) => <div className="package-item-row" key={`${editingPack?._id || "new"}-${index}`}><label>Product<select required value={item.product} onChange={(event) => setIncludedItems((items) => items.map((current, itemIndex) => itemIndex === index ? { ...current, product: event.target.value } : current))}><option value="">Select product</option>{products.filter((product) => product._id === item.product || (product.isActive && !includedItems.some((selected, selectedIndex) => selectedIndex !== index && selected.product === product._id))).map((product) => <option key={product._id} value={product._id}>{product.name}{product.isActive ? "" : " (Archived)"}</option>)}</select></label><label>Quantity<input type="number" min="1" max="99" step="1" required value={item.quantity} onChange={(event) => setIncludedItems((items) => items.map((current, itemIndex) => itemIndex === index ? { ...current, quantity: event.target.value } : current))} /></label><button className="package-item-remove" type="button" aria-label={`Remove included item ${index + 1}`} onClick={() => setIncludedItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}{includedItems.length === 0 && <small>No products included yet. Add one or more items to this package.</small>}</div><button className="button button-dark">{editingPack ? "Save changes" : "Create box"} <Plus size={16} /></button>{editingPack && <button className="button button-light" type="button" onClick={() => { setEditingPack(null); setIncludedItems([]); }}>Cancel</button>}</form><div className="simple-table product-admin-table"><div className="simple-row simple-head"><span>Package</span><span>Type</span><span>Price</span><span>Items included</span><span>Status</span><span>Actions</span></div>{packs.map((pack) => <div className="simple-row" key={pack._id}><strong>{pack.name}</strong><span>{pack.packageType}</span><span>{money(pack.price)}</span><span>{pack.includedItems?.length || 0}</span><span className="status-pill">{pack.isActive ? "Active" : "Archived"}</span><div className="product-admin-actions"><button type="button" onClick={() => { setEditingPack(pack); setIncludedItems((pack.includedItems || []).map((item) => ({ product: item.product?._id || item.product, quantity: item.quantity }))); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>{pack.isActive ? <button type="button" className="danger-action" onClick={() => archivePack(pack)}>Delete</button> : <button type="button" onClick={() => restorePack(pack)}>Restore</button>}</div></div>)}</div>{!packs.length && <div className="table-empty">No packages have been created yet.</div>}<small>Available catalogue items: {products.filter((product) => product.isActive).length}. Deleted packages are archived so existing order records remain intact.</small></div>;
}

function AdminSubscriptions() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api("/admin/subscriptions").then(setData).catch((err) => setError(err.message)); }, []);
  return <div className="admin-panel"><span className="eyebrow">RECURRING ORDERS</span><h2>Subscriptions</h2>{error && <div className="notice-error">{error}</div>}<div className="simple-table"><div className="simple-row simple-head"><span>Customer</span><span>FreshBox</span><span>Frequency</span><span>Next delivery</span><span>Status</span></div>{data.map((item) => <div className="simple-row" key={item._id}><strong>{item.user?.name || "Customer"}</strong><span>{item.package?.name}</span><span>{item.frequency}</span><span>{new Date(item.nextDeliveryDate).toLocaleDateString()}</span><span className="status-pill">{item.status}</span></div>)}</div></div>;
}

function AdminSuppliers() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const load = () => api("/admin/suppliers").then(setData).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const input = Object.fromEntries(new FormData(formElement));
    try { await api("/admin/suppliers", { method: "POST", body: jsonBody(input) }); await load(); formElement.reset(); }
    catch (err) { setError(err.message); }
  }
  return <div className="admin-panel"><span className="eyebrow">FARM NETWORK</span><h2>Suppliers</h2>{error && <div className="notice-error">{error}</div>}<form className="admin-product-form" onSubmit={submit}><label>Supplier name<input name="name" required /></label><label>Contact person<input name="contactPerson" /></label><label>Phone<input name="phone" /></label><label>Email<input name="email" type="email" /></label><button className="button button-dark">Add supplier <Plus size={16} /></button></form><div className="simple-table"><div className="simple-row simple-head"><span>Name</span><span>Contact</span><span>Phone</span><span>Email</span><span>Status</span></div>{data.map((item) => <div className="simple-row" key={item._id}><strong>{item.name}</strong><span>{item.contactPerson || "—"}</span><span>{item.phone || "—"}</span><span>{item.email || "—"}</span><span>{item.status}</span></div>)}</div></div>;
}

function AdminReviews() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const load = () => api("/admin/reviews").then(setData).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  async function moderate(id, status) {
    try { await api(`/admin/reviews/${id}`, { method: "PATCH", body: jsonBody({ status }) }); await load(); }
    catch (err) { setError(err.message); }
  }
  return <div className="admin-panel"><span className="eyebrow">CUSTOMER FEEDBACK</span><h2>Reviews</h2>{error && <div className="notice-error">{error}</div>}{data.map((item) => <div className="review-admin-row" key={item._id}><strong>{item.product?.name} · {item.rating}/5</strong><p>{item.comment}</p><small>{item.user?.name} · {item.status}</small>{item.status === "pending" && <span><button className="text-button" onClick={() => moderate(item._id, "approved")}>Approve</button><button className="text-button danger-text" onClick={() => moderate(item._id, "rejected")}>Reject</button></span>}</div>)}{!data.length && <div className="table-empty">No reviews yet.</div>}</div>;
}

function AdminSupport() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const load = () => api("/admin/support").then(setData).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  async function status(item, status) {
    const response = window.prompt("Optional response to the customer:", item.response || "");
    if (response === null) return;
    try { await api(`/admin/support/${item._id}`, { method: "PATCH", body: jsonBody({ status, response }) }); await load(); }
    catch (err) { setError(err.message); }
  }
  return <div className="admin-panel"><span className="eyebrow">CUSTOMER CARE</span><h2>Support requests</h2>{error && <div className="notice-error">{error}</div>}{data.map((item) => <article className="support-admin-card" key={item._id}><div><strong>{item.subject}</strong><span className="status-pill">{item.status}</span></div><p>{item.message}</p><small>{item.user?.name} · {item.user?.email} · {new Date(item.createdAt).toLocaleDateString()}</small><div><button className="text-button" onClick={() => status(item, "in_progress")}>In progress</button><button className="text-button" onClick={() => status(item, "resolved")}>Resolve</button></div></article>)}{!data.length && <div className="table-empty">No support requests yet.</div>}</div>;
}

function AdminDelivery() {
    const [areas, setAreas] = useState([]);
    const [slots, setSlots] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [staff, setStaff] = useState([]);
    const [error, setError] = useState("");
    const load = () => Promise.all([
      api("/admin/delivery/areas").then(setAreas),
      api("/admin/delivery/slots").then(setSlots),
      api("/admin/deliveries").then(setDeliveries),
      api("/admin/staff").then(setStaff)
    ]).catch((err) => setError(err.message));
    useEffect(() => { load(); }, []);
    async function addArea(event) {
      event.preventDefault();
      const formElement = event.currentTarget;
      const data = Object.fromEntries(new FormData(formElement));
      try {
        await api("/admin/delivery/areas", { method: "POST", body: jsonBody({ name: data.name, districts: data.districts.split(",").map((district) => district.trim()).filter(Boolean), fee: Number(data.fee), minimumOrder: Number(data.minimumOrder || 0) }) });
        formElement.reset(); await load();
      } catch (err) { setError(err.message); }
    }
    async function addSlot(event) {
      event.preventDefault();
      const formElement = event.currentTarget;
      const data = Object.fromEntries(new FormData(formElement));
      try {
        await api("/admin/delivery/slots", { method: "POST", body: jsonBody({ date: data.date, startTime: data.startTime, endTime: data.endTime, capacity: Number(data.capacity) }) });
        formElement.reset(); await load();
      } catch (err) { setError(err.message); }
    }
    async function assign(orderId, assignedTo) {
      try {
        await api(`/admin/deliveries/${orderId}/assign`, { method: "PATCH", body: jsonBody({ assignedTo }) });
        await load();
      } catch (err) { setError(err.message); }
    }
    return <>{error && <div className="notice-error">{error}</div>}<div className="admin-panel"><span className="eyebrow">DELIVERY QUEUE</span><h2>Upcoming deliveries</h2><div className="simple-table"><div className="simple-row simple-head delivery-row"><span>Order</span><span>Customer</span><span>Delivery date</span><span>Address</span><span>Assign to</span></div>{deliveries.map((order) => <div className="simple-row delivery-row" key={order._id}><strong>{order.orderNumber}</strong><span>{order.user?.name}</span><span>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "—"} · {order.deliverySlot}</span><span>{order.addressSnapshot.city}, {order.addressSnapshot.district}</span><select aria-label={`Assign ${order.orderNumber}`} value={order.deliveryAssignee || ""} onChange={(event) => assign(order._id, event.target.value)}><option value="">Unassigned</option>{staff.filter((person) => person.role === "staff").map((person) => <option value={person._id} key={person._id}>{person.name}</option>)}</select></div>)}</div></div><div className="admin-panel"><span className="eyebrow">SERVICE COVERAGE</span><h2>Delivery areas</h2><form className="admin-product-form" onSubmit={addArea}><label>Area name<input name="name" required /></label><label>Districts (comma-separated)<input name="districts" placeholder="Colombo, Gampaha" /></label><label>Delivery fee<input name="fee" type="number" min="0" required /></label><label>Minimum order<input name="minimumOrder" type="number" min="0" defaultValue="0" /></label><button className="button button-dark">Add delivery area <Plus size={16} /></button></form><div className="simple-table"><div className="simple-row simple-head"><span>Area</span><span>Districts</span><span>Fee</span><span>Minimum order</span><span>Status</span></div>{areas.map((area) => <div className="simple-row" key={area._id}><strong>{area.name}</strong><span>{area.districts.join(", ") || "All"}</span><span>{money(area.fee)}</span><span>{money(area.minimumOrder)}</span><span>{area.isActive ? "Active" : "Inactive"}</span></div>)}</div></div><div className="admin-panel"><span className="eyebrow">DELIVERY CAPACITY</span><h2>Delivery slots</h2><form className="admin-product-form" onSubmit={addSlot}><label>Date<input name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></label><label>Start time<input name="startTime" type="time" required /></label><label>End time<input name="endTime" type="time" required /></label><label>Capacity<input name="capacity" type="number" min="1" required /></label><button className="button button-dark">Add slot <Plus size={16} /></button></form><div className="simple-table"><div className="simple-row simple-head"><span>Date</span><span>Time</span><span>Booked</span><span>Capacity</span><span>Status</span></div>{slots.map((slot) => <div className="simple-row" key={slot._id}><strong>{new Date(slot.date).toLocaleDateString()}</strong><span>{slot.startTime}–{slot.endTime}</span><span>{slot.booked}</span><span>{slot.capacity}</span><span>{slot.isActive ? "Active" : "Inactive"}</span></div>)}</div></div></>;
  }

  function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [error, setError] = useState("");
    const load = () => api("/admin/coupons").then(setCoupons).catch((err) => setError(err.message));
    useEffect(() => { load(); }, []);
    async function submit(event) {
      event.preventDefault();
      const formElement = event.currentTarget;
      const data = Object.fromEntries(new FormData(formElement));
      try {
        await api("/admin/coupons", { method: "POST", body: jsonBody({
          code: data.code, discountType: data.discountType, discountValue: Number(data.discountValue),
          minimumOrder: Number(data.minimumOrder || 0), usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined
        }) });
        formElement.reset(); await load();
      } catch (err) { setError(err.message); }
    }
    async function toggle(coupon) {
      try { await api(`/admin/coupons/${coupon._id}`, { method: "PATCH", body: jsonBody({ isActive: !coupon.isActive }) }); await load(); }
      catch (err) { setError(err.message); }
    }
    return <div className="admin-panel"><span className="eyebrow">PROMOTIONS</span><h2>Coupons</h2>{error && <div className="notice-error">{error}</div>}<form className="admin-product-form" onSubmit={submit}><label>Coupon code<input name="code" required /></label><label>Discount type<select name="discountType"><option value="percentage">Percentage</option><option value="fixed">Fixed LKR</option></select></label><label>Discount value<input name="discountValue" type="number" min="0.01" step="0.01" required /></label><label>Minimum order<input name="minimumOrder" type="number" min="0" defaultValue="0" /></label><label>Usage limit<input name="usageLimit" type="number" min="1" /></label><button className="button button-dark">Create coupon <Plus size={16} /></button></form><div className="simple-table"><div className="simple-row simple-head"><span>Code</span><span>Discount</span><span>Minimum</span><span>Used / limit</span><span>State</span><span>Action</span></div>{coupons.map((coupon) => <div className="simple-row coupon-row" key={coupon._id}><strong>{coupon.code}</strong><span>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : money(coupon.discountValue)}</span><span>{money(coupon.minimumOrder)}</span><span>{coupon.usedCount} / {coupon.usageLimit || "∞"}</span><span>{coupon.isActive ? "Active" : "Inactive"}</span><button className="text-button" onClick={() => toggle(coupon)}>{coupon.isActive ? "Disable" : "Enable"}</button></div>)}</div></div>;
  }

  function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [error, setError] = useState("");
    const load = () => Promise.all([
      api("/admin/customers").then(setCustomers),
      api("/admin/staff").then(setStaff)
    ]).catch((err) => setError(err.message));
    useEffect(() => { load(); }, []);
    async function changeRole(user, role) {
      try { await api(`/admin/users/${user._id}/role`, { method: "PATCH", body: jsonBody({ role }) }); await load(); }
      catch (err) { setError(err.message); }
    }
    async function changeStatus(user, status) {
      try { await api(`/admin/users/${user._id}/status`, { method: "PATCH", body: jsonBody({ status }) }); await load(); }
      catch (err) { setError(err.message); }
    }
    return <>{error && <div className="notice-error">{error}</div>}<div className="admin-panel"><span className="eyebrow">CUSTOMER DIRECTORY</span><h2>Customers</h2><div className="simple-table"><div className="simple-row simple-head"><span>Name</span><span>Email</span><span>Phone</span><span>Joined</span><span>Account</span><span>Action</span></div>{customers.map((person) => <div className="simple-row customer-row" key={person._id}><strong>{person.name}</strong><span>{person.email}</span><span>{person.phone || "—"}</span><span>{new Date(person.createdAt).toLocaleDateString()}</span><span>{person.status}</span><button className="text-button" onClick={() => changeStatus(person, person.status === "active" ? "disabled" : "active")}>{person.status === "active" ? "Disable" : "Enable"}</button></div>)}</div></div><div className="admin-panel"><span className="eyebrow">ACCESS MANAGEMENT</span><h2>Staff and roles</h2><div className="simple-table"><div className="simple-row simple-head"><span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Change role</span></div>{staff.map((person) => <div className="simple-row staff-row" key={person._id}><strong>{person.name}</strong><span>{person.email}</span><span>{person.role}</span><span>{person.status}</span><select aria-label={`Change role for ${person.name}`} value={person.role} onChange={(event) => changeRole(person, event.target.value)}><option value="admin">Admin</option><option value="staff">Operations staff</option><option value="customer">Customer</option></select></div>)}</div></div></>;
  }

  function AdminReports() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
      Promise.all([
        api("/admin/reports/sales"),
        api("/admin/reports/orders"),
        api("/admin/reports/products"),
        api("/admin/reports/inventory")
      ]).then(([sales, orders, products, inventory]) => setData({ sales, orders, products, inventory })).catch((err) => setError(err.message));
    }, []);
    return <div className="admin-panel"><span className="eyebrow">BUSINESS PERFORMANCE</span><h2>Reports</h2>{error && <div className="notice-error">{error}</div>}{!data ? <div className="table-empty">Loading reports…</div> : <div className="report-grid">{[["Sales by day", data.sales], ["Order statuses", data.orders], ["Best sellers", data.products], ["Inventory snapshot", data.inventory.slice(0, 20)]].map(([title, rows]) => <section className="report-card" key={title}><h3>{title}</h3>{rows.length ? rows.slice(0, 12).map((row, index) => <div key={row._id || row.sku || index}><span>{row.name || row._id || "Product"}</span><strong>{row.sales !== undefined ? money(row.sales) : row.revenue !== undefined ? money(row.revenue) : row.quantity !== undefined ? `${row.quantity} items` : row.count !== undefined ? `${row.count} orders` : `${row.stock} in stock`}</strong></div>) : <p>No report data yet.</p>}</section>)}</div>}</div>;
  }
function ErrorState({ message }) {
  return <div className="error-state"><div><CircleHelp /></div><h2>We hit a little bump.</h2><p>{message || "Please try again in a moment."}</p><button className="button button-dark" onClick={() => window.location.reload()}>Try again <ArrowRight size={16} /></button></div>;
}

function NotFound() {
  return <div className="not-found"><span className="eyebrow">404 · THIS PATH ISN’T IN SEASON</span><h1>Looks like this<br />page wandered <em>off.</em></h1><Link to="/" className="button button-dark">Back to FreshBox <ArrowRight size={16} /></Link></div>;
}

export default App;
