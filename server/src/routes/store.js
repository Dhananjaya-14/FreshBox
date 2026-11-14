import { Router } from "express";
import express from "express";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import {
  AuditLog, Cart, Category, Coupon, DeliveryArea, DeliverySlot, Notification, Order,
  Package, Product, Review, StockMovement, Subscription, SupportRequest, Supplier, User, StockBatch
} from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";

const router = Router();
const admin = [authenticate, allowRoles("admin", "staff")];
const administrator = [authenticate, allowRoles("admin")];
const isId = (id) => mongoose.isValidObjectId(id);
const objectId = (value) => new mongoose.Types.ObjectId(value);
const uploadDirectory = new URL("../../uploads/", import.meta.url);
const imageTypes = {
  "image/jpeg": { extension: "jpg", matches: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: "png", matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", matches: (buffer) => buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" }
};

function sriLankaClock() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  return Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
}

function isFutureSlot(slot, clock = sriLankaClock()) {
  const date = slot.date.toISOString().slice(0, 10);
  const today = `${clock.year}-${clock.month}-${clock.day}`;
  return date > today || (date === today && slot.startTime > `${clock.hour}:${clock.minute}`);
}

router.get("/categories", async (_req, res) => {
  res.json(await Category.find({ isActive: true }).sort({ name: 1 }));
});

router.get("/products", async (req, res) => {
  const { search, category, organic, seasonal, sort = "newest" } = req.query;
  const filter = { isActive: true };
  if (category && isId(category)) filter.category = category;
  if (organic === "true") filter.isOrganic = true;
  if (seasonal === "true") filter.isSeasonal = true;
  if (search) filter.$text = { $search: String(search).slice(0, 100) };
  const sortBy = sort === "price-low" ? { price: 1 } : sort === "price-high" ? { price: -1 } : sort === "popular" ? { isFeatured: -1 } : { createdAt: -1 };
  const products = await Product.find(filter).populate("category", "name slug").sort(sortBy).limit(100);
  res.json(products);
});

router.get("/products/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate("category", "name slug");
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json(product);
});

router.get("/packages", async (_req, res) => res.json(await Package.find({ isActive: true }).populate("includedItems.product", "name price unit").sort({ price: 1 })));
router.get("/packages/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid package id." });
  const pack = await Package.findOne({ _id: req.params.id, isActive: true }).populate("includedItems.product", "name price unit");
  if (!pack) return res.status(404).json({ message: "Package not found." });
  res.json(pack);
});

router.get("/cart", authenticate, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate("items.product", "name price salePrice stock images unit isActive")
    .populate("items.package", "name price image isActive");
  res.json(cart || { items: [] });
});

router.post("/cart/items", authenticate, async (req, res) => {
  const input = z.object({
    itemId: z.string().refine(isId),
    itemType: z.enum(["product", "package"]),
    quantity: z.number().int().min(1).max(99)
  }).parse(req.body);
  const Model = input.itemType === "product" ? Product : Package;
  const item = await Model.findOne({ _id: input.itemId, isActive: true });
  if (!item) return res.status(404).json({ message: "This item is unavailable." });
  if (input.itemType === "product" && item.stock < input.quantity) {
    return res.status(409).json({ message: `Only ${item.stock} are currently available.` });
  }
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id, items: [] });
  const existing = cart.items.find((line) => String(line[input.itemType]) === input.itemId);
  if (existing) existing.quantity = Math.min(99, existing.quantity + input.quantity);
  else cart.items.push({ [input.itemType]: objectId(input.itemId), quantity: input.quantity });
  await cart.save();
  await cart.populate("items.product", "name price salePrice stock images unit isActive");
  await cart.populate("items.package", "name price image isActive");
  res.status(201).json(cart);
});

router.patch("/cart/items/:id", authenticate, async (req, res) => {
  const quantity = z.number().int().min(0).max(99).parse(req.body.quantity);
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found." });
  const line = cart.items.id(req.params.id);
  if (!line) return res.status(404).json({ message: "Cart item not found." });
  if (quantity === 0) line.deleteOne();
  else line.quantity = quantity;
  await cart.save();
  await cart.populate("items.product", "name price salePrice stock images unit isActive");
  await cart.populate("items.package", "name price image isActive");
  res.json(cart);
});

router.delete("/cart/items/:id", authenticate, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found." });
  const line = cart.items.id(req.params.id);
  if (!line) return res.status(404).json({ message: "Cart item not found." });
  line.deleteOne();
  await cart.save();
  res.json(cart);
});

router.post("/coupons/validate", authenticate, async (req, res) => {
  const { code, subtotal } = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().nonnegative() }).parse(req.body);
  const now = new Date();
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(), isActive: true, minimumOrder: { $lte: subtotal },
    $and: [{ $or: [{ startDate: null }, { startDate: { $lte: now } }] }, { $or: [{ endDate: null }, { endDate: { $gte: now } }] }, { $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] }]
  });
  if (!coupon) return res.status(400).json({ message: "This coupon is not valid for this order." });
  const discount = Math.min(subtotal, coupon.discountType === "percentage" ? subtotal * coupon.discountValue / 100 : coupon.discountValue);
  res.json({ code: coupon.code, discount: Math.round(discount * 100) / 100 });
});

router.get("/delivery/areas", async (_req, res) => res.json(await DeliveryArea.find({ isActive: true }).select("name districts fee minimumOrder")));
router.get("/delivery/slots", async (req, res) => {
  const clock = sriLankaClock();
  const dateText = req.query.date ? String(req.query.date) : `${clock.year}-${clock.month}-${clock.day}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return res.status(400).json({ message: "Invalid delivery date." });
  const start = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return res.status(400).json({ message: "Invalid delivery date." });
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const slots = await DeliverySlot.find({ date: { $gte: start, $lt: end }, isActive: true, $expr: { $lt: ["$booked", "$capacity"] } }).sort({ startTime: 1 });
  res.json(slots.filter((slot) => isFutureSlot(slot, clock)));
});

router.post("/orders", authenticate, async (req, res) => {
  const input = z.object({
    addressId: z.string().refine(isId),
    deliverySlotId: z.string().refine(isId),
    couponCode: z.string().trim().min(1).max(40).optional(),
    instructions: z.string().max(1000).optional()
  }).parse(req.body);
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Your cart is empty." });
  const address = req.user.addresses.id(input.addressId);
  if (!address) return res.status(400).json({ message: "Select a saved delivery address." });
  const clock = sriLankaClock();
  const today = new Date(`${clock.year}-${clock.month}-${clock.day}T00:00:00.000Z`);
  const requestedSlot = await DeliverySlot.findById(input.deliverySlotId);
  if (!requestedSlot || !isFutureSlot(requestedSlot, clock)) {
    return res.status(409).json({ message: "Choose an available future delivery slot." });
  }
  const slot = await DeliverySlot.findOneAndUpdate(
    { _id: input.deliverySlotId, date: { $gte: today }, isActive: true, $expr: { $lt: ["$booked", "$capacity"] } },
    { $inc: { booked: 1 } },
    { new: true }
  );
  if (!slot) return res.status(409).json({ message: "This delivery slot is no longer available." });

  const orderItems = [];
  const decremented = [];
  let claimedCoupon = null;
  let createdOrder = null;
  const cartItems = cart.items.map((item) => item.toObject());
  try {
    for (const line of cart.items) {
      if (line.product) {
        const product = await Product.findOneAndUpdate(
          { _id: line.product, isActive: true, stock: { $gte: line.quantity } },
          { $inc: { stock: -line.quantity } },
          { new: true }
        );
        if (!product) throw Object.assign(new Error("A product is unavailable or has insufficient stock. Please review your cart."), { status: 409 });
        decremented.push({ product, quantity: line.quantity });
        const unitPrice = product.salePrice ?? product.price;
        orderItems.push({ name: product.name, itemId: product.id, itemType: "product", quantity: line.quantity, unitPrice, lineTotal: unitPrice * line.quantity });
      } else {
        const pack = await Package.findOne({ _id: line.package, isActive: true }).populate("includedItems.product");
        if (!pack) throw Object.assign(new Error("A package in your cart is no longer available."), { status: 409 });
        for (const included of pack.includedItems) {
          const quantity = included.quantity * line.quantity;
          const product = await Product.findOneAndUpdate(
            { _id: included.product?._id, isActive: true, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true }
          );
          if (!product) throw Object.assign(new Error(`A product included in ${pack.name} is unavailable. Please review your cart.`), { status: 409 });
          decremented.push({ product, quantity });
        }
        orderItems.push({
          name: pack.name,
          itemId: pack.id,
          itemType: "package",
          quantity: line.quantity,
          unitPrice: pack.price,
          lineTotal: pack.price * line.quantity,
          components: pack.includedItems.map((included) => ({
            productId: included.product._id,
            quantity: included.quantity * line.quantity
          }))
        });
      }
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const couponCode = input.couponCode ? input.couponCode.toUpperCase() : null;
    let discount = 0;
    if (couponCode) {
      const now = new Date();
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        minimumOrder: { $lte: subtotal },
        $and: [
          { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
          { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
          { $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] }
        ]
      });
      if (!coupon) throw Object.assign(new Error("This coupon is not valid for this order."), { status: 400 });
      discount = Math.round(Math.min(subtotal, coupon.discountType === "percentage" ? subtotal * coupon.discountValue / 100 : coupon.discountValue) * 100) / 100;
      claimedCoupon = await Coupon.findOneAndUpdate(
        { _id: coupon.id, isActive: true, $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      if (!claimedCoupon) throw Object.assign(new Error("This coupon has reached its usage limit."), { status: 400 });
    }
    const area = await DeliveryArea.findOne({ isActive: true, $or: [{ districts: address.district }, { districts: { $size: 0 } }] }).sort({ fee: 1 });
    if (!area) throw Object.assign(new Error("Delivery is not available in the selected district."), { status: 400 });
    if (subtotal < area.minimumOrder) throw Object.assign(new Error(`The minimum order for this area is LKR ${area.minimumOrder}.`), { status: 400 });

    const orderNumber = `FB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const order = await Order.create({
      orderNumber, user: req.user.id, items: orderItems, addressSnapshot: address.toObject(),
      deliveryDate: slot.date, deliverySlotId: slot.id, deliverySlot: `${slot.startTime} - ${slot.endTime}`, instructions: input.instructions,
      totals: { subtotal, deliveryFee: area.fee, discount, total: subtotal - discount + area.fee, currency: "LKR" },
      coupon: claimedCoupon?.id,
      couponCode: claimedCoupon?.code,
      statusHistory: [{ status: "pending_confirmation", changedBy: req.user.id, note: "Order placed" }]
    });
    createdOrder = order;
    await Promise.all(decremented.map(({ product, quantity }) => StockMovement.create({
      product: product.id, movementType: "sale", quantity: -quantity, reason: `Order ${orderNumber}`, referenceId: order.id, createdBy: req.user.id
    })));
    cart.items = [];
    await cart.save();
    await Notification.create({ user: req.user.id, title: "Order placed", message: `Your order ${orderNumber} has been received.`, type: "order" });
    await AuditLog.create({ user: req.user.id, action: "order.created", entityType: "Order", entityId: order.id });
    res.status(201).json(order);
  } catch (error) {
    if (createdOrder) {
      await Promise.all([
        Order.deleteOne({ _id: createdOrder.id }),
        StockMovement.deleteMany({ referenceId: createdOrder.id }),
        Notification.deleteMany({ user: req.user.id, message: `Your order ${createdOrder.orderNumber} has been received.` }),
        AuditLog.deleteMany({ user: req.user.id, entityId: createdOrder.id })
      ]);
      cart.items = cartItems;
      await cart.save();
    }
    await Promise.all(decremented.map(({ product, quantity }) => Product.updateOne({ _id: product.id }, { $inc: { stock: quantity } })));
    await DeliverySlot.updateOne({ _id: slot.id }, { $inc: { booked: -1 } });
    if (claimedCoupon) await Coupon.updateOne({ _id: claimedCoupon.id }, { $inc: { usedCount: -1 } });
    throw error;
  }
});

router.get("/orders/my", authenticate, async (req, res) => res.json(await Order.find({ user: req.user.id }).sort({ createdAt: -1 })));
router.get("/orders/:id", authenticate, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid order id." });
  const query = { _id: req.params.id };
  if (!["admin", "staff"].includes(req.user.role)) query.user = req.user.id;
  const order = await Order.findOne(query);
  if (!order) return res.status(404).json({ message: "Order not found." });
  res.json(order);
});

router.get("/subscriptions/my", authenticate, async (req, res) => res.json(await Subscription.find({ user: req.user.id }).populate("package", "name price image").sort({ createdAt: -1 })));
router.post("/subscriptions", authenticate, async (req, res) => {
  const input = z.object({ packageId: z.string().refine(isId), frequency: z.enum(["weekly", "monthly"]), startDate: z.coerce.date(), addressId: z.string().refine(isId) }).parse(req.body);
  const pack = await Package.findOne({ _id: input.packageId, isActive: true });
  if (!pack || !req.user.addresses.id(input.addressId)) return res.status(400).json({ message: "Choose an available package and saved address." });
  const subscription = await Subscription.create({ user: req.user.id, package: pack.id, frequency: input.frequency, startDate: input.startDate, nextDeliveryDate: input.startDate, addressId: input.addressId });
  res.status(201).json(subscription);
});
router.patch("/subscriptions/:id/:action", authenticate, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid subscription id." });
  const actions = { pause: "paused", resume: "active", cancel: "cancelled" };
  if (!actions[req.params.action]) return res.status(404).json({ message: "Subscription action not found." });
  const subscription = await Subscription.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { status: actions[req.params.action] }, { new: true });
  if (!subscription) return res.status(404).json({ message: "Subscription not found." });
  res.json(subscription);
});
router.post("/subscriptions/:id/skip", authenticate, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid subscription id." });
  const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user.id, status: "active" });
  if (!subscription) return res.status(404).json({ message: "Active subscription not found." });
  const next = new Date(subscription.nextDeliveryDate);
  if (subscription.frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
  }
  subscription.nextDeliveryDate = next;
  await subscription.save();
  res.json(subscription);
});

router.get("/reviews/product/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
  res.json(await Review.find({ product: req.params.id, status: "approved" }).populate("user", "name").sort({ createdAt: -1 }));
});
router.post("/reviews", authenticate, async (req, res) => {
  const input = z.object({ productId: z.string().refine(isId), orderId: z.string().refine(isId), rating: z.number().int().min(1).max(5), comment: z.string().max(2000).optional() }).parse(req.body);
  const purchased = await Order.exists({ _id: input.orderId, user: req.user.id, "items.itemId": input.productId, orderStatus: "delivered" });
  if (!purchased) return res.status(403).json({ message: "You can review products after a completed purchase." });
  res.status(201).json(await Review.create({ user: req.user.id, product: input.productId, order: input.orderId, rating: input.rating, comment: input.comment }));
});

router.get("/notifications", authenticate, async (req, res) => res.json(await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100)));
router.patch("/notifications/:id/read", authenticate, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid notification id." });
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { readAt: new Date() }, { new: true });
  if (!item) return res.status(404).json({ message: "Notification not found." });
  res.json(item);
});
router.post("/support", authenticate, async (req, res) => {
  const input = z.object({ subject: z.string().trim().min(3).max(160), message: z.string().trim().min(10).max(5000) }).parse(req.body);
  res.status(201).json(await SupportRequest.create({ user: req.user.id, ...input }));
});
router.get("/support/my", authenticate, async (req, res) => res.json(await SupportRequest.find({ user: req.user.id }).sort({ createdAt: -1 })));

router.get("/admin/dashboard/summary", ...administrator, async (_req, res) => {
  const [orders, users, products, sales] = await Promise.all([
    Order.countDocuments(), User.countDocuments({ role: "customer" }), Product.countDocuments({ isActive: true }),
    Order.aggregate([{ $match: { paymentStatus: { $in: ["pending", "paid"] }, orderStatus: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$totals.total" } } }])
  ]);
  res.json({ orders, customers: users, products, sales: sales[0]?.total || 0 });
});
router.get("/admin/orders", ...admin, async (_req, res) => res.json(await Order.find().populate("user", "name email phone").sort({ createdAt: -1 }).limit(200)));
router.patch(["/admin/orders/:id/status", "/admin/deliveries/:id/status"], ...admin, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid order id." });
  const status = z.enum(["confirmed", "preparing", "packed", "out_for_delivery", "delivered", "cancelled", "refund_pending", "refunded"]).parse(req.body.status);
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });
  if (order.orderStatus === "cancelled") return res.status(409).json({ message: "This order can no longer be updated." });
  const transitions = {
    pending_confirmation: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["packed"],
    packed: ["out_for_delivery"],
    out_for_delivery: ["delivered"],
    delivered: ["refund_pending"],
    refund_pending: ["refunded"]
  };
  if (!transitions[order.orderStatus]?.includes(status)) {
    return res.status(409).json({ message: `Order status cannot move from ${order.orderStatus.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.` });
  }
  if (status === "cancelled") {
    for (const item of order.items) {
      if (item.itemType === "product") {
        await Product.updateOne({ _id: item.itemId }, { $inc: { stock: item.quantity } });
        await StockMovement.create({ product: item.itemId, movementType: "adjustment", quantity: item.quantity, reason: `Cancellation ${order.orderNumber}`, referenceId: order.id, createdBy: req.user.id });
      } else {
        for (const component of item.components || []) {
          await Product.updateOne({ _id: component.productId }, { $inc: { stock: component.quantity } });
          await StockMovement.create({ product: component.productId, movementType: "adjustment", quantity: component.quantity, reason: `Cancellation ${order.orderNumber}`, referenceId: order.id, createdBy: req.user.id });
        }
      }
    }
    if (order.deliverySlotId) await DeliverySlot.updateOne({ _id: order.deliverySlotId, booked: { $gt: 0 } }, { $inc: { booked: -1 } });
    if (order.coupon) await Coupon.updateOne({ _id: order.coupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
  order.orderStatus = status;
  order.statusHistory.push({ status, changedBy: req.user.id });
  await order.save();
  await AuditLog.create({ user: req.user.id, action: `order.${status}`, entityType: "Order", entityId: order.id });
  res.json(order);
});

router.get("/admin/inventory", ...admin, async (_req, res) => res.json(await Product.find().populate("category", "name").sort({ stock: 1 })));
router.patch("/admin/inventory/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
  const input = z.object({ stock: z.number().int().min(0), reason: z.string().trim().min(3).max(300) }).parse(req.body);
  const current = await Product.findById(req.params.id);
  if (!current) return res.status(404).json({ message: "Product not found." });
  const difference = input.stock - current.stock;
  const product = await Product.findOneAndUpdate({ _id: req.params.id, stock: current.stock }, { stock: input.stock }, { new: true, runValidators: true });
  if (!product) return res.status(409).json({ message: "Stock changed while you were editing it. Reload inventory and try again." });
  if (difference) {
    await StockMovement.create({
      product: product.id,
      movementType: difference > 0 ? "received" : "adjustment",
      quantity: difference,
      reason: input.reason,
      createdBy: req.user.id
    });
  }
  res.json(product);
});
router.get("/admin/suppliers", ...admin, async (_req, res) => res.json(await Supplier.find().sort({ name: 1 })));
router.post("/admin/suppliers", ...administrator, async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(160), contactPerson: z.string().max(120).optional(), phone: z.string().max(30).optional(), email: z.union([z.string().email(), z.literal("")]).optional(), address: z.string().max(500).optional() }).parse(req.body);
  if (!input.email) delete input.email;
  res.status(201).json(await Supplier.create(input));
});
router.patch("/admin/suppliers/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid supplier id." });
  const input = z.object({
    name: z.string().trim().min(2).max(160).optional(),
    contactPerson: z.string().max(120).optional(),
    phone: z.string().max(30).optional(),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    address: z.string().max(500).optional(),
    status: z.enum(["active", "inactive"]).optional()
  }).parse(req.body);
  if (input.email === "") input.email = undefined;
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
  if (!supplier) return res.status(404).json({ message: "Supplier not found." });
  res.json(supplier);
});
router.get("/admin/categories", ...admin, async (_req, res) => res.json(await Category.find().sort({ name: 1 })));
router.get("/admin/stock/batches", ...admin, async (_req, res) => res.json(await StockBatch.find().populate("product", "name sku").populate("supplier", "name").sort({ receivedAt: -1 }).limit(200)));
router.get("/admin/coupons", ...administrator, async (_req, res) => res.json(await Coupon.find().sort({ createdAt: -1 })));
router.post("/admin/coupons", ...administrator, async (req, res) => {
  const input = z.object({
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
    discountType: z.enum(["fixed", "percentage"]),
    discountValue: z.number().positive(),
    minimumOrder: z.number().nonnegative().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    usageLimit: z.number().int().positive().optional()
  }).parse(req.body);
  if (input.discountType === "percentage" && input.discountValue > 100) return res.status(400).json({ message: "Percentage discounts cannot exceed 100%." });
  if (input.startDate && input.endDate && input.endDate < input.startDate) return res.status(400).json({ message: "The coupon end date must follow its start date." });
  res.status(201).json(await Coupon.create({ ...input, code: input.code.toUpperCase() }));
});
router.patch("/admin/coupons/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid coupon id." });
  const input = z.object({
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/).optional(),
    discountType: z.enum(["fixed", "percentage"]).optional(),
    discountValue: z.number().positive().optional(),
    minimumOrder: z.number().nonnegative().optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional()
  }).parse(req.body);
  if (input.discountType === "percentage" && input.discountValue > 100) return res.status(400).json({ message: "Percentage discounts cannot exceed 100%." });
  if (input.code) input.code = input.code.toUpperCase();
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
  if (!coupon) return res.status(404).json({ message: "Coupon not found." });
  res.json(coupon);
});
router.get("/admin/delivery/areas", ...administrator, async (_req, res) => res.json(await DeliveryArea.find().sort({ name: 1 })));
router.post("/admin/delivery/areas", ...administrator, async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(120), districts: z.array(z.string().trim().min(2).max(100)).max(50).default([]), fee: z.number().nonnegative(), minimumOrder: z.number().nonnegative().optional() }).parse(req.body);
  res.status(201).json(await DeliveryArea.create(input));
});
router.patch("/admin/delivery/areas/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid delivery area id." });
  const input = z.object({ name: z.string().trim().min(2).max(120).optional(), districts: z.array(z.string().trim().min(2).max(100)).max(50).optional(), fee: z.number().nonnegative().optional(), minimumOrder: z.number().nonnegative().optional(), isActive: z.boolean().optional() }).parse(req.body);
  const area = await DeliveryArea.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
  if (!area) return res.status(404).json({ message: "Delivery area not found." });
  res.json(area);
});
router.get("/admin/delivery/slots", ...administrator, async (_req, res) => res.json(await DeliverySlot.find().sort({ date: 1, startTime: 1 }).limit(500)));
router.post("/admin/delivery/slots", ...administrator, async (req, res) => {
  const input = z.object({ date: z.coerce.date(), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), capacity: z.number().int().min(1).max(1000) }).parse(req.body);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (input.date < today) return res.status(400).json({ message: "Delivery slots must be today or in the future." });
  res.status(201).json(await DeliverySlot.create(input));
});
router.patch("/admin/delivery/slots/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid delivery slot id." });
  const input = z.object({ capacity: z.number().int().min(1).max(1000).optional(), isActive: z.boolean().optional() }).parse(req.body);
  const slot = await DeliverySlot.findOneAndUpdate({ _id: req.params.id, $expr: { $gte: [input.capacity ?? 0, "$booked"] } }, input, { new: true, runValidators: true });
  if (!slot) return res.status(404).json({ message: "Delivery slot not found or capacity is below existing bookings." });
  res.json(slot);
});
router.get("/admin/customers", ...administrator, async (_req, res) => res.json(await User.find({ role: "customer" }).select("name email phone status createdAt").sort({ createdAt: -1 }).limit(500)));
router.get("/admin/staff", ...administrator, async (_req, res) => res.json(await User.find({ role: { $in: ["admin", "staff"] } }).select("name email phone role status createdAt").sort({ createdAt: -1 })));
router.patch("/admin/users/:id/role", authenticate, allowRoles("admin"), async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid user id." });
  if (req.params.id === req.user.id) return res.status(400).json({ message: "You cannot change your own role." });
  const role = z.enum(["customer", "staff", "admin"]).parse(req.body.role);
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("name email phone role status");
  if (!user) return res.status(404).json({ message: "User not found." });
  await AuditLog.create({ user: req.user.id, action: `user.role.${role}`, entityType: "User", entityId: user.id });
  res.json(user);
});
router.patch("/admin/users/:id/status", authenticate, allowRoles("admin"), async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid user id." });
  if (req.params.id === req.user.id) return res.status(400).json({ message: "You cannot disable your own account." });
  const status = z.enum(["active", "disabled"]).parse(req.body.status);
  const user = await User.findByIdAndUpdate(req.params.id, { status, $inc: { refreshVersion: 1 } }, { new: true }).select("name email phone role status");
  if (!user) return res.status(404).json({ message: "User not found." });
  await AuditLog.create({ user: req.user.id, action: `user.status.${status}`, entityType: "User", entityId: user.id });
  res.json(user);
});
router.get("/admin/reviews", ...administrator, async (_req, res) => res.json(await Review.find().populate("user", "name").populate("product", "name").sort({ createdAt: -1 })));
router.patch("/admin/reviews/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid review id." });
  const status = z.enum(["approved", "rejected"]).parse(req.body.status);
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) return res.status(404).json({ message: "Review not found." });
  res.json(review);
});
router.get("/admin/support", ...admin, async (_req, res) => res.json(await SupportRequest.find().populate("user", "name email").sort({ createdAt: -1 })));
router.patch("/admin/support/:id", ...admin, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid support request id." });
  const input = z.object({ status: z.enum(["open", "in_progress", "resolved"]), response: z.string().max(5000).optional() }).parse(req.body);
  const ticket = await SupportRequest.findByIdAndUpdate(req.params.id, input, { new: true });
  if (!ticket) return res.status(404).json({ message: "Support request not found." });
  res.json(ticket);
});
router.get("/admin/audit-logs", ...administrator, async (_req, res) => res.json(await AuditLog.find().populate("user", "name email").sort({ createdAt: -1 }).limit(200)));

router.get("/users/me", authenticate, (req, res) => res.json({ user: req.user }));
router.get("/users/me/addresses", authenticate, (req, res) => res.json(req.user.addresses));
router.patch("/users/me", authenticate, async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().max(30).optional() }).parse(req.body);
  Object.assign(req.user, input);
  await req.user.save();
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role, addresses: req.user.addresses } });
});
router.post("/users/me/addresses", authenticate, async (req, res) => {
  const input = z.object({ recipientName: z.string().trim().min(2).max(100), phone: z.string().trim().min(5).max(30), addressLines: z.array(z.string().trim().min(1).max(200)).min(1).max(3), city: z.string().trim().min(2).max(100), district: z.string().trim().min(2).max(100), postalCode: z.string().max(20).optional(), deliveryArea: z.string().max(100).optional() }).parse(req.body);
  req.user.addresses.push(input);
  await req.user.save();
  res.status(201).json(req.user.addresses.at(-1));
});
router.patch("/users/me/addresses/:addressId", authenticate, async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ message: "Address not found." });
  const input = z.object({ recipientName: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().min(5).max(30).optional(), addressLines: z.array(z.string().trim().min(1).max(200)).min(1).max(3).optional(), city: z.string().trim().min(2).max(100).optional(), district: z.string().trim().min(2).max(100).optional(), postalCode: z.string().max(20).optional(), deliveryArea: z.string().max(100).optional() }).parse(req.body);
  Object.assign(address, input);
  await req.user.save();
  res.json(address);
});
router.delete("/users/me/addresses/:addressId", authenticate, async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ message: "Address not found." });
  address.deleteOne();
  await req.user.save();
  res.status(204).end();
});

router.post("/admin/uploads", ...administrator, express.raw({ type: Object.keys(imageTypes), limit: "5mb" }), async (req, res) => {
  const contentType = req.get("content-type")?.split(";")[0].trim();
  const imageType = imageTypes[contentType];
  if (!imageType) return res.status(415).json({ message: "Upload a JPEG, PNG, or WebP image." });
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ message: "Choose an image to upload." });
  if (!imageType.matches(req.body)) return res.status(400).json({ message: "The uploaded file is not a valid image of the selected type." });

  const filename = `${randomUUID()}.${imageType.extension}`;
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(new URL(filename, uploadDirectory), req.body, { flag: "wx" });
  res.status(201).json({ url: `/uploads/${filename}` });
});

router.get("/admin/products", ...administrator, async (_req, res) => {
  res.json(await Product.find().populate("category", "name slug").sort({ createdAt: -1 }).limit(500));
});

router.post("/admin/products", ...administrator, async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(160), sku: z.string().trim().min(2).max(40),
    category: z.string().refine(isId), description: z.string().max(5000).optional(),
    images: z.array(z.string().url()).max(8).optional(), price: z.number().nonnegative(),
    salePrice: z.number().nonnegative().optional(), unit: z.enum(["box", "kg", "item", "pack"]).optional(),
    stock: z.number().int().nonnegative().optional(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    isOrganic: z.boolean().optional(), isSeasonal: z.boolean().optional(), isFeatured: z.boolean().optional(), isActive: z.boolean().optional()
  }).parse(req.body);
  res.status(201).json(await Product.create(input));
});
router.patch("/admin/products/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
  const input = z.object({
    name: z.string().trim().min(2).max(160).optional(), sku: z.string().trim().min(2).max(40).optional(),
    category: z.string().refine(isId).optional(), description: z.string().max(5000).optional(),
    images: z.array(z.string().url()).max(8).optional(), price: z.number().nonnegative().optional(),
    salePrice: z.number().nonnegative().nullable().optional(), unit: z.enum(["box", "kg", "item", "pack"]).optional(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    isOrganic: z.boolean().optional(), isSeasonal: z.boolean().optional(), isFeatured: z.boolean().optional(), isActive: z.boolean().optional()
  }).parse(req.body);
  const product = await Product.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json(product);
});
router.delete("/admin/products/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json({ message: "Product archived." });
});
router.post("/admin/categories", ...administrator, async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().trim().regex(/^[a-z0-9-]+$/), description: z.string().max(1000).optional(), image: z.string().url().optional() }).parse(req.body);
  res.status(201).json(await Category.create(input));
});
router.patch("/admin/categories/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid category id." });
  const input = z.object({ name: z.string().trim().min(2).max(100).optional(), slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(), description: z.string().max(1000).optional(), image: z.string().url().optional(), isActive: z.boolean().optional() }).parse(req.body);
  const category = await Category.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: "Category not found." });
  res.json(category);
});
router.post("/admin/packages", ...administrator, async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(160), description: z.string().max(2000).optional(), price: z.number().nonnegative(), packageType: z.enum(["mini", "family", "premium", "custom"]), includedItems: z.array(z.object({ product: z.string().refine(isId), quantity: z.number().int().min(1).max(99) })).max(50).optional(), image: z.string().url().optional() }).parse(req.body);
  res.status(201).json(await Package.create(input));
});
router.get("/admin/packages", ...administrator, async (_req, res) => res.json(await Package.find().populate("includedItems.product", "name price stock")));
router.patch("/admin/packages/:id", ...administrator, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid package id." });
  const input = z.object({ name: z.string().trim().min(2).max(160).optional(), description: z.string().max(2000).optional(), price: z.number().nonnegative().optional(), packageType: z.enum(["mini", "family", "premium", "custom"]).optional(), includedItems: z.array(z.object({ product: z.string().refine(isId), quantity: z.number().int().min(1).max(99) })).max(50).optional(), image: z.string().url().optional(), isActive: z.boolean().optional() }).parse(req.body);
  const pack = await Package.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
  if (!pack) return res.status(404).json({ message: "Package not found." });
  res.json(pack);
});

export default router;
