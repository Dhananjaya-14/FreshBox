import mongoose from "mongoose";

const { Schema, model } = mongoose;

const addressSchema = new Schema({
  recipientName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLines: { type: [String], required: true },
  city: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  postalCode: String,
  deliveryArea: String
}, { _id: true });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ["customer", "admin", "staff"], default: "customer" },
  status: { type: String, enum: ["active", "disabled"], default: "active" },
  refreshVersion: { type: Number, default: 0 },
  addresses: [addressSchema]
}, { timestamps: true });

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  image: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0 },
  unit: { type: String, enum: ["box", "kg", "item", "pack"], default: "item" },
  stock: { type: Number, default: 0, min: 0 },
  tags: { type: [String], default: [] },
  isOrganic: { type: Boolean, default: false },
  isSeasonal: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
productSchema.index({ name: "text", description: "text", tags: "text" });

const packageSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  packageType: { type: String, enum: ["mini", "family", "premium", "custom"], required: true },
  includedItems: [{ product: { type: Schema.Types.ObjectId, ref: "Product" }, quantity: { type: Number, min: 1 } }],
  isActive: { type: Boolean, default: true },
  image: String
}, { timestamps: true });

const cartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    package: { type: Schema.Types.ObjectId, ref: "Package" },
    quantity: { type: Number, min: 1, required: true }
  }]
}, { timestamps: true });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: [{
    name: String,
    itemId: Schema.Types.ObjectId,
    itemType: { type: String, enum: ["product", "package"] },
    quantity: Number,
    unitPrice: Number,
    lineTotal: Number,
    components: [{ productId: Schema.Types.ObjectId, quantity: Number }]
  }],
  addressSnapshot: { type: addressSchema, required: true },
  deliveryDate: Date,
  deliverySlotId: { type: Schema.Types.ObjectId, ref: "DeliverySlot" },
  deliverySlot: String,
  deliveryAssignee: { type: Schema.Types.ObjectId, ref: "User" },
  instructions: String,
  totals: { subtotal: Number, deliveryFee: Number, discount: Number, total: Number, currency: { type: String, default: "LKR" } },
  paymentMethod: { type: String, enum: ["cod"], default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  coupon: { type: Schema.Types.ObjectId, ref: "Coupon" },
  couponCode: String,
  orderStatus: { type: String, enum: ["pending_confirmation", "confirmed", "preparing", "packed", "out_for_delivery", "delivered", "cancelled", "refund_pending", "refunded"], default: "pending_confirmation" },
  statusHistory: [{ status: String, note: String, changedBy: { type: Schema.Types.ObjectId, ref: "User" }, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

const subscriptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  package: { type: Schema.Types.ObjectId, ref: "Package", required: true },
  frequency: { type: String, enum: ["weekly", "monthly"], required: true },
  startDate: { type: Date, required: true },
  nextDeliveryDate: { type: Date, required: true },
  addressId: Schema.Types.ObjectId,
  status: { type: String, enum: ["active", "paused", "cancelled"], default: "active" }
}, { timestamps: true });

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ["fixed", "percentage"], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minimumOrder: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const supplierSchema = new Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

const stockBatchSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
  quantityReceived: { type: Number, required: true, min: 1 },
  quantityAvailable: { type: Number, required: true, min: 0 },
  receivedAt: { type: Date, default: Date.now },
  expiryDate: Date
}, { timestamps: true });

const stockMovementSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  batch: { type: Schema.Types.ObjectId, ref: "StockBatch" },
  movementType: { type: String, enum: ["received", "adjustment", "sale", "waste"], required: true },
  quantity: { type: Number, required: true },
  reason: String,
  referenceId: Schema.Types.ObjectId,
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 2000, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "info" },
  readAt: Date
}, { timestamps: true });

const supportSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, maxlength: 5000 },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  response: String
}, { timestamps: true });

const deliveryAreaSchema = new Schema({
  name: { type: String, required: true, trim: true },
  districts: [String],
  fee: { type: Number, required: true, min: 0 },
  minimumOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const deliverySlotSchema = new Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  booked: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const auditLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: Schema.Types.ObjectId,
  details: Schema.Types.Mixed
}, { timestamps: true });

export const User = model("User", userSchema);
export const Category = model("Category", categorySchema);
export const Product = model("Product", productSchema);
export const Package = model("Package", packageSchema);
export const Cart = model("Cart", cartSchema);
export const Order = model("Order", orderSchema);
export const Subscription = model("Subscription", subscriptionSchema);
export const Coupon = model("Coupon", couponSchema);
export const Supplier = model("Supplier", supplierSchema);
export const StockBatch = model("StockBatch", stockBatchSchema);
export const StockMovement = model("StockMovement", stockMovementSchema);
export const Review = model("Review", reviewSchema);
export const Notification = model("Notification", notificationSchema);
export const SupportRequest = model("SupportRequest", supportSchema);
export const DeliveryArea = model("DeliveryArea", deliveryAreaSchema);
export const DeliverySlot = model("DeliverySlot", deliverySlotSchema);
export const AuditLog = model("AuditLog", auditLogSchema);
