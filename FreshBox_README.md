# FreshBox -- Fresh Produce Delivery Platform

A full-stack e-commerce and operations management website for
**FreshBox**, a Sri Lankan fresh-produce business connecting local
farmers and suppliers with customers through online ordering,
subscriptions, and home delivery.

## Technology Stack

-   MongoDB -- database
-   Express.js -- backend API
-   React.js -- frontend
-   Node.js -- server runtime

## 1. Project Overview

FreshBox provides fresh fruits and vegetables through convenient online
ordering and delivery. Customers should be able to browse products,
choose produce boxes, customize orders, subscribe to regular deliveries,
pay, and track orders. Administrators should manage products, inventory,
orders, customers, subscriptions, suppliers, promotions, deliveries, and
reports.

### Business goals

-   Provide fresh, high-quality fruits and vegetables.
-   Connect customers with local farmers and suppliers.
-   Make ordering and recurring purchases convenient.
-   Maintain freshness and reliable delivery.
-   Encourage customer loyalty.
-   Reduce food waste through better stock management.
-   Expand delivery coverage gradually across Sri Lanka.

### Initial business prices

  Product / package                                     Price
  ----------------------------- -----------------------------
  Mini Box                                          LKR 2,500
  Family Fresh Produce Box                          LKR 5,000
  Premium Organic Produce Box                       LKR 7,000
  Customized FreshBox                          From LKR 2,500
  Restaurant and café supply      Quotation based on quantity

Prices, delivery fees, discounts, and subscription rules must be
configurable in the database. Do not hard-code prices in the frontend.

## 2. User Roles

### Guest

-   View home, about, contact, FAQ, and delivery information.
-   Browse, search, filter, and view products.
-   Register or sign in.
-   Use a temporary cart if guest-cart support is enabled.

### Customer

-   Manage profile and delivery addresses.
-   Browse products and packages.
-   Add, update, and remove cart items.
-   Customize eligible produce boxes.
-   Apply coupon codes.
-   Select delivery dates and time slots.
-   Place one-time orders or subscriptions.
-   Select available payment methods.
-   View order history and track orders.
-   Pause, resume, skip, or request cancellation of subscriptions under
    the business policy.
-   Save favourites and review purchased products.
-   Receive notifications and contact support.

### Administrator

-   View business dashboard and reports.
-   Manage products, categories, packages, images, prices, and
    availability.
-   Manage inventory, stock batches, suppliers, and waste records.
-   Manage orders, subscriptions, customers, delivery areas, and
    delivery slots.
-   Assign orders to staff or delivery partners.
-   Manage coupons, promotions, reviews, FAQs, and website content.
-   Manage staff accounts and role permissions.
-   Export reports and review administrative audit logs.

### Operations staff

-   View assigned orders.
-   Confirm produce availability.
-   Prepare and pack orders.
-   Update preparation and dispatch statuses.
-   View necessary delivery details.
-   Update stock only when permission is granted.

Use backend role-based authorization. Hiding a button in React is not
sufficient security.

## 3. Website Pages

### Public pages

-   Home -- hero section, featured products, packages, benefits,
    promotions.
-   Shop -- catalogue, search, filters, sorting, categories.
-   Product Details -- images, description, price, availability, add to
    cart.
-   FreshBox Packages -- Mini, Family, Premium Organic, and seasonal
    packages.
-   Customize a Box -- select eligible produce and quantities.
-   Subscriptions -- weekly/monthly plan details and terms.
-   About Us -- story, mission, vision, local farmer support.
-   Contact Us -- contact form and business contact details.
-   FAQs -- ordering, payment, delivery, freshness, refunds,
    subscriptions.
-   Login / Register.
-   Privacy Policy and Terms and Conditions.

### Customer account pages

-   Customer Dashboard
-   My Profile
-   Saved Addresses
-   My Cart
-   Checkout
-   My Orders
-   Order Details and Tracking
-   My Subscriptions
-   Wishlist
-   Reviews
-   Notifications
-   Support Requests

### Admin pages

-   Dashboard Overview
-   Products and Categories
-   Package Builder
-   Inventory / Stock
-   Orders
-   Subscriptions
-   Customers
-   Suppliers
-   Delivery Management
-   Coupons and Promotions
-   Reviews and Feedback
-   Website Content
-   Reports and Analytics
-   Staff and Roles
-   Settings and Audit Logs

## 4. Core Functional Requirements

### Product catalogue

Each product should support a name, SKU, category, descriptions, images,
price, optional sale price, unit type (box/kg/item/pack), stock or
availability, active status, featured flag, tags, and optional
organic/seasonal labels.

Suggested categories: - Fresh Fruits - Fresh Vegetables - Family Boxes -
Organic Produce - Seasonal Boxes - Customized Boxes - Restaurant and
Café Supply

### Search and filtering

-   Search by product name or keyword.
-   Filter by category, price, organic/seasonal status.
-   Sort by price, newest, or popularity.
-   Display useful empty and no-results states.

### Cart

-   Add products and packages.
-   Update quantities and remove items.
-   Calculate line totals, subtotal, discounts, delivery fee, and final
    total.
-   Validate stock before checkout.
-   Preserve the cart for signed-in users.
-   Optionally merge guest cart after sign-in.

The backend must recalculate all prices and totals. Never trust totals
submitted by the browser.

### Customized FreshBox

1.  Select a box type or size.
2.  View eligible available fruits and vegetables.
3.  Select products and quantities.
4.  Show capacity or estimated box value.
5.  Calculate the final price.
6.  Add the customized box to the cart.

Administrators control eligible products, quantity limits, and pricing
rules.

### Checkout

Collect customer contact details, delivery address, delivery area,
delivery date/time slot, delivery instructions, payment method, coupon,
and final order summary. The backend must validate stock, prices,
delivery eligibility, coupon validity, and totals before creating an
order.

### Payments

Support configurable payment methods such as Cash on Delivery (if
enabled) and an online payment gateway selected by the business. Track
pending, successful, failed, and refunded states where supported. Verify
provider webhooks on the backend before marking an order as paid. Never
store card numbers or CVV values.

### Orders and tracking

Suggested statuses: 1. Pending Confirmation 2. Confirmed 3. Preparing 4.
Packed 5. Out for Delivery 6. Delivered 7. Cancelled 8. Refund Pending /
Refunded

Show customers an order timeline. Record each status change, timestamp,
and staff account.

### Subscriptions

-   Select an eligible package and weekly/monthly frequency.
-   Choose start date and delivery address.
-   View next delivery and subscription history.
-   Pause, resume, skip, or request cancellation.
-   Create recurring orders according to the selected schedule.

Do not automatically charge recurring payments unless the selected
payment provider supports it and the customer has explicitly authorized
it. Otherwise create an order requiring payment confirmation.

### Inventory

-   Track stock for each produce item.
-   Record stock received from suppliers.
-   Reserve/reduce stock for confirmed orders.
-   Release reserved stock when appropriate after cancellation.
-   Set low-stock alerts.
-   Record damaged, expired, or wasted produce.
-   Maintain stock movement history.
-   Prevent checkout when stock is unavailable.
-   Track batch, received date, expiry/best-before date, and supplier
    where relevant.

### Suppliers

-   Add and edit local farmers and suppliers.
-   Store contact information.
-   Record supplied produce, purchase dates, quantities, and costs.
-   View supplier purchase history.
-   Link received stock to supplier batches.

A supplier portal is optional for a later release.

### Delivery

-   Configure serviceable areas and delivery fees.
-   Configure delivery days, time slots, and capacity.
-   Assign orders to delivery staff/partners.
-   Update dispatch and delivery statuses.
-   Record delivery notes or proof of delivery if needed.

Start with administrator-managed delivery areas and status updates. Live
GPS tracking can be added later.

### Promotions and coupons

Support fixed or percentage discounts, minimum-order discounts,
new-customer offers, subscription promotions, date ranges, usage limits,
per-customer limits, and active/inactive status. Validate coupons on the
backend.

### Reviews and feedback

-   Allow reviews for eligible purchased products.
-   Support ratings and written comments.
-   Allow administrators to moderate reviews.
-   Display approved reviews.
-   Accept general service feedback.

### Notifications

Notify customers about order confirmation, payment status, preparation,
dispatch, delivery, subscription reminders, cancellations, and refunds.
Notify administrators about low stock and operational issues. Start with
in-app and email notifications; SMS/WhatsApp can be added later.

### Reports

-   Daily, weekly, monthly, and yearly sales.
-   Total orders and average order value.
-   Best-selling products and category sales.
-   Pending, completed, and cancelled orders.
-   Active subscriptions and customer growth.
-   Repeat customers.
-   Low stock, waste, and damaged-stock records.
-   Supplier purchase summaries.

Restrict financial reports to authorized management users.

## 5. Suggested MERN Stack

### Frontend

-   React.js with Vite
-   React Router
-   Axios
-   Tailwind CSS or Bootstrap
-   React Hook Form
-   Zod or Yup validation
-   Context API or Redux Toolkit
-   Recharts for dashboard charts

### Backend

-   Node.js and Express.js
-   MongoDB and Mongoose
-   JWT authentication
-   bcrypt or Argon2 password hashing
-   express-validator or Zod
-   Helmet, CORS allowlist, and rate limiting
-   Multer for upload handling
-   Cloud image storage for production
-   Email provider for transactional messages

### Tools and deployment

-   Git and GitHub
-   Postman
-   MongoDB Atlas or managed MongoDB
-   Frontend hosting such as Vercel/Netlify
-   Backend hosting such as Render/Railway or another Node.js host

Select compatible package versions and commit lock files.

## 6. System Architecture

``` text
Customer / Admin / Staff
          |
          v
     React Frontend
          |
       Axios API
          |
          v
     Express REST API
          |
   --------------------
   |        |         |
 Auth   Business   Integrations
        Services   (Email/Payment)
   |        |
   --------------------
          |
       Mongoose
          |
        MongoDB
```

React must never connect directly to MongoDB. All data access and
business rules go through the Express API.

## 7. Suggested Folder Structure

``` text
freshbox/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/
│       │   ├── layout/
│       │   ├── products/
│       │   ├── cart/
│       │   └── admin/
│       ├── pages/
│       │   ├── public/
│       │   ├── auth/
│       │   ├── customer/
│       │   └── admin/
│       ├── features/
│       ├── hooks/
│       ├── context/
│       ├── services/
│       ├── utils/
│       ├── routes/
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── jobs/
│   │   ├── app.js
│   │   └── server.js
│   └── uploads/          # Development only; use cloud storage in production
├── docs/
│   ├── api-documentation.md
│   ├── database-design.md
│   └── user-roles.md
├── .gitignore
└── README.md
```

Keep controllers focused on HTTP request/response handling. Put reusable
business logic in services and validation schemas in separate files.

## 8. Suggested MongoDB Models

  -----------------------------------------------------------------------
  Model                               Important fields
  ----------------------------------- -----------------------------------
  User                                name, email, passwordHash, phone,
                                      role, status

  Address                             userId, recipientName, phone,
                                      addressLines, city, district,
                                      postalCode, deliveryArea

  Category                            name, slug, description, image,
                                      isActive

  Product                             name, SKU, categoryId, description,
                                      images, price, salePrice, unit,
                                      stock, tags, isActive

  Package                             name, description, price,
                                      packageType, includedItems,
                                      customizationRules, isActive

  Cart                                userId/sessionId, items, updatedAt

  Order                               orderNumber, userId, items,
                                      addressSnapshot, deliverySlot,
                                      totals, paymentStatus, orderStatus

  OrderStatusHistory                  orderId, status, note, changedBy,
                                      createdAt

  Payment                             orderId, provider, reference,
                                      amount, currency, status

  Subscription                        userId, packageId, frequency,
                                      startDate, nextDeliveryDate,
                                      addressId, status

  Coupon                              code, discountType, discountValue,
                                      startDate, endDate, usageLimit,
                                      isActive

  Supplier                            name, contactPerson, phone, email,
                                      address, status

  StockBatch                          productId, supplierId,
                                      quantityReceived,
                                      quantityAvailable, receivedAt,
                                      expiryDate

  StockMovement                       productId, batchId, movementType,
                                      quantity, reason, referenceId,
                                      createdBy

  Review                              userId, productId, orderId, rating,
                                      comment, status

  Notification                        userId, title, message, type,
                                      readAt

  SupportRequest                      userId, subject, message, status,
                                      response

  DeliveryArea                        name, districts, fee, minimumOrder,
                                      isActive

  DeliverySlot                        date, startTime, endTime, capacity,
                                      available

  AuditLog                            userId, action, entityType,
                                      entityId, timestamp
  -----------------------------------------------------------------------

Use order-item snapshots for historical product names and prices so
later product edits do not change old orders.

## 9. Suggested REST API

Base path: `/api`

### Authentication

``` text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
```

### Users and addresses

``` text
GET    /users/me
PATCH  /users/me
GET    /users/me/addresses
POST   /users/me/addresses
PATCH  /users/me/addresses/:addressId
DELETE /users/me/addresses/:addressId
```

### Products and categories

``` text
GET    /categories
GET    /products
GET    /products/:productId
POST   /products                 # Admin
PATCH  /products/:productId      # Admin
DELETE /products/:productId     # Admin
POST   /categories               # Admin
PATCH  /categories/:categoryId   # Admin
```

### Packages and cart

``` text
GET    /packages
GET    /packages/:packageId
POST   /packages                 # Admin
PATCH  /packages/:packageId      # Admin
POST   /packages/custom-quote
GET    /cart
POST   /cart/items
PATCH  /cart/items/:itemId
DELETE /cart/items/:itemId
POST   /checkout/validate
POST   /orders
```

### Orders and payments

``` text
GET    /orders/my
GET    /orders/:orderId
GET    /orders/:orderId/tracking
GET    /admin/orders
PATCH  /admin/orders/:orderId/status
POST   /payments/create-session
POST   /payments/webhook
GET    /payments/:paymentId
```

### Subscriptions

``` text
GET    /subscriptions/my
POST   /subscriptions
GET    /subscriptions/:subscriptionId
PATCH  /subscriptions/:subscriptionId/pause
PATCH  /subscriptions/:subscriptionId/resume
POST   /subscriptions/:subscriptionId/skip
POST   /subscriptions/:subscriptionId/cancel
GET    /admin/subscriptions
```

### Inventory and suppliers

``` text
GET    /admin/inventory
PATCH  /admin/inventory/:productId
POST   /admin/stock/receive
POST   /admin/stock/adjust
GET    /admin/stock/movements
GET    /admin/suppliers
POST   /admin/suppliers
PATCH  /admin/suppliers/:supplierId
```

### Delivery

``` text
GET    /delivery/areas
GET    /delivery/slots
GET    /admin/deliveries
PATCH  /admin/deliveries/:orderId/assign
PATCH  /admin/deliveries/:orderId/status
```

### Coupons, reviews, notifications, support

``` text
POST   /coupons/validate
GET    /reviews/product/:productId
POST   /reviews
GET    /notifications
PATCH  /notifications/:notificationId/read
POST   /support
GET    /support/my
GET    /admin/support
PATCH  /admin/support/:requestId
```

### Dashboard and reports

``` text
GET    /admin/dashboard/summary
GET    /admin/reports/sales
GET    /admin/reports/products
GET    /admin/reports/orders
GET    /admin/reports/inventory
GET    /admin/reports/customers
GET    /admin/audit-logs
```

These are proposed routes; define exact request/response schemas during
implementation. Apply authentication and role checks to every protected
endpoint. Verify payment-provider webhook signatures.

## 10. Business Rules

1.  Prices must come from the database and be recalculated by the
    backend.
2.  Only active and available products can be ordered.
3.  Recheck stock when an order is confirmed.
4.  Store order item names, prices, quantities, discounts, delivery fee,
    and final total as snapshots.
5.  Coupons must be active, within their dates, and within usage limits.
6.  Delivery must be limited to configured service areas and slots.
7.  Customers can only access their own account data and orders.
8.  Only authorized users can change order status, stock, prices, or
    roles.
9.  Payment must be verified by the backend/provider webhook.
10. Subscription orders follow the selected frequency and cut-off rules.
11. Cancelled orders release reserved stock where appropriate.
12. Record important stock and order changes.
13. Never expose supplier costs or profit data to ordinary customers.

## 11. Security

-   Hash passwords; never store plain-text passwords.
-   Use short-lived access tokens and a secure refresh-token strategy.
-   Prefer secure, HttpOnly, SameSite cookies for refresh tokens.
-   Validate and sanitize incoming data.
-   Rate-limit login, registration, password reset, and public forms.
-   Configure Helmet and CORS for known frontend origins.
-   Keep secrets in environment variables and never commit `.env`.
-   Restrict image upload file types and sizes.
-   Enforce roles on the backend.
-   Do not return password hashes or sensitive fields.
-   Use HTTPS in production.
-   Verify payment webhooks.
-   Do not log passwords or payment secrets.
-   Back up the database and test recovery.

## 12. Environment Variables

Backend `server/.env` example:

``` env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/freshbox

JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

PAYMENT_PROVIDER=
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Frontend `client/.env` example:

``` env
VITE_API_BASE_URL=http://localhost:5000/api
```

Use placeholders in documentation only. Never publish real secrets.

## 13. Local Development

### Requirements

-   Node.js LTS
-   npm
-   Local MongoDB or MongoDB Atlas
-   Git

### Clone

``` bash
git clone <your-repository-url>
cd freshbox
```

### Backend

``` bash
cd server
npm install
# Create server/.env
npm run dev
```

### Frontend (in a second terminal)

``` bash
cd client
npm install
# Create client/.env
npm run dev
```

Typical development URLs: - Frontend: `http://localhost:5173` - Backend:
`http://localhost:5000`

Confirm ports in the actual configuration.

Suggested backend scripts:

``` json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest"
  }
}
```

Suggested frontend scripts:

``` json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

## 14. UI / UX Guidelines

The design should communicate freshness, trust, convenience, and
sustainability.

-   Use a clean, fresh visual style.
-   Suggested primary colour: green, with white and warm neutral
    backgrounds.
-   Use high-quality fruit and vegetable photography.
-   Show clear prices and availability on product cards.
-   Make Add to Cart and Customize Box actions easy to find.
-   Keep checkout simple.
-   Support mobile, tablet, and desktop.
-   Use accessible colour contrast, keyboard navigation, labels, and
    image alt text.
-   Include loading, success, empty, and error states.
-   Do not use colour alone to communicate stock or order status.

## 15. Testing

### Frontend

-   Navigation and protected routes.
-   Product search, filters, and details.
-   Cart quantity and total calculations.
-   Form validation.
-   Checkout.
-   Responsive layouts.
-   Customer/admin UI permissions.

### Backend

-   Registration and login.
-   Authorization.
-   Product CRUD.
-   Cart and checkout validation.
-   Stock reservation and release.
-   Coupon validation.
-   Order status transitions.
-   Subscription scheduling.
-   Payment webhook verification.
-   Report access permissions.

### End-to-end scenarios

1.  Guest browses and registers.
2.  Customer adds a Mini Box to the cart.
3.  Customer checks out with a valid address.
4.  Backend validates stock and creates the order.
5.  Admin confirms and prepares the order.
6.  Customer sees status updates.
7.  Order is marked delivered.
8.  Customer submits a review.
9.  Customer creates a weekly subscription.
10. Admin receives and resolves a low-stock alert.

## 16. Development Roadmap

### Phase 1 -- Foundation

-   Create React and Express projects.
-   Connect MongoDB.
-   Set up routing and responsive layouts.
-   Implement authentication and role-based access.
-   Create database models.

### Phase 2 -- Storefront

-   Build home, shop, category, and product pages.
-   Implement search and filtering.
-   Add admin product and package management.
-   Build cart.

### Phase 3 -- Ordering

-   Implement checkout and addresses.
-   Add delivery areas and time slots.
-   Create orders and customer order history.
-   Build admin order management and tracking.

### Phase 4 -- Operations

-   Implement inventory and stock movements.
-   Add supplier management.
-   Add customized FreshBox.
-   Add coupons and notifications.

### Phase 5 -- Subscriptions and payments

-   Implement weekly/monthly subscriptions.
-   Add pause, resume, skip, and cancellation rules.
-   Integrate the selected payment provider securely.

### Phase 6 -- Reports and launch

-   Build dashboard reports.
-   Complete security and permission testing.
-   Test responsiveness and accessibility.
-   Configure hosting, domain, HTTPS, backups, and monitoring.

## 17. Recommended MVP

Build these first to keep the first release manageable:

-   Responsive home page.
-   Product catalogue and product details.
-   Customer registration and login.
-   Cart and checkout.
-   Delivery address and fee management.
-   Cash on Delivery or one selected payment method.
-   Customer order history and tracking.
-   Admin product, stock, and order management.
-   Basic sales and order dashboard.

Add subscriptions, advanced customization, supplier management, coupons,
detailed analytics, and automated notifications after the core ordering
flow is stable.

## 18. Future Enhancements

-   Live delivery tracking.
-   Farmer/supplier portal.
-   Delivery route optimization.
-   WhatsApp or SMS notifications.
-   Personalized recommendations.
-   AI recipe suggestions using available produce.
-   Seasonal availability recommendations.
-   Multi-branch and multi-warehouse inventory.
-   Loyalty points and reward tiers.
-   Mobile application.
-   Sinhala and Tamil language support.
-   Demand forecasting to reduce food waste.

These are future enhancements, not first-release requirements.

## 19. Decisions Required Before Launch

The FreshBox team must confirm:

-   Exact delivery areas and fees.
-   Delivery days, time slots, and order cut-off times.
-   Final package contents, weights, and prices.
-   Whether unavailable produce can be substituted.
-   Cancellation, refund, and replacement policies.
-   Accepted payment methods.
-   Whether subscriptions are prepaid or paid per delivery.
-   Minimum order quantities for restaurant/café customers.
-   Freshness, storage, and handling procedures.
-   Customer support contact details.
-   Privacy policy and terms and conditions.

Business-plan prices and financial projections are planning estimates.
The live website must use final prices and operating policies approved
by the FreshBox team.

## 20. Success Criteria

The first production release is ready when:

-   Customers can browse and place orders.
-   Backend totals are calculated correctly.
-   Stock cannot be oversold through normal checkout.
-   Customers can view their own orders and delivery status.
-   Admins can manage products, stock, and orders.
-   Protected routes enforce backend permissions.
-   Online payment status is verified securely.
-   The website works on mobile and desktop.
-   Important user flows have been tested.
-   Production secrets, HTTPS, backups, and monitoring are configured.

## 21. License and Ownership

This project is intended for development and maintenance by the FreshBox
business team. Add the final license, ownership details, contact
information, and repository links before making the repository public.
