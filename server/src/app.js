import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import storeRoutes from "./routes/store.js";
import { authenticate, allowRoles } from "./middleware/auth.js";
import { Order, Product, StockBatch, StockMovement, Supplier } from "./models/index.js";
import { z } from "zod";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", (_req, res, next) => {
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(fileURLToPath(new URL("../uploads/", import.meta.url)), { index: false, maxAge: "1d" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "freshbox-api" }));
app.use("/api/auth", authRoutes);
app.use("/api", storeRoutes);

const adminOnly = [authenticate, allowRoles("admin")];
const validId = (id) => mongoose.isValidObjectId(id);

app.get("/api/admin/stock/movements", authenticate, allowRoles("admin", "staff"), async (_req, res) => {
  res.json(await StockMovement.find().populate("product", "name sku").populate("createdBy", "name").sort({ createdAt: -1 }).limit(200));
});
app.post("/api/admin/stock/receive", ...adminOnly, async (req, res) => {
  const input = z.object({ productId: z.string().refine(validId), supplierId: z.string().refine(validId).optional(), quantity: z.number().int().min(1).max(100000), expiryDate: z.coerce.date().optional(), reason: z.string().max(300).optional() }).parse(req.body);
  const product = await Product.findByIdAndUpdate(input.productId, { $inc: { stock: input.quantity } }, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found." });
  const batch = await StockBatch.create({ product: product.id, supplier: input.supplierId, quantityReceived: input.quantity, quantityAvailable: input.quantity, expiryDate: input.expiryDate });
  const movement = await StockMovement.create({ product: product.id, batch: batch.id, movementType: "received", quantity: input.quantity, reason: input.reason, createdBy: req.user.id });
  res.status(201).json({ product, batch, movement });
});
app.post("/api/admin/stock/adjust", ...adminOnly, async (req, res) => {
  const input = z.object({ productId: z.string().refine(validId), quantity: z.number().int().min(-100000).max(100000).refine((value) => value !== 0), reason: z.string().trim().min(3).max(300) }).parse(req.body);
  const product = await Product.findOneAndUpdate({ _id: input.productId, stock: { $gte: input.quantity < 0 ? -input.quantity : 0 } }, { $inc: { stock: input.quantity } }, { new: true });
  if (!product) return res.status(409).json({ message: "Product not found or adjustment would make stock negative." });
  const movement = await StockMovement.create({ product: product.id, movementType: input.quantity > 0 ? "received" : "adjustment", quantity: input.quantity, reason: input.reason, createdBy: req.user.id });
  res.json({ product, movement });
});
app.get("/api/admin/reports/sales", ...adminOnly, async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return res.status(400).json({ message: "Invalid report date range." });
  const report = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, orderStatus: { $ne: "cancelled" } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, orders: { $sum: 1 }, sales: { $sum: "$totals.total" } } },
    { $sort: { _id: 1 } }
  ]);
  res.json(report);
});
app.get("/api/admin/reports/products", ...adminOnly, async (_req, res) => {
  res.json(await Order.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.itemId", name: { $first: "$items.name" }, quantity: { $sum: "$items.quantity" }, revenue: { $sum: "$items.lineTotal" } } },
    { $sort: { quantity: -1 } }, { $limit: 50 }
  ]));
});
app.get("/api/admin/reports/orders", ...adminOnly, async (_req, res) => {
  res.json(await Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 }, total: { $sum: "$totals.total" } } }, { $sort: { count: -1 } }]));
});
app.get("/api/admin/reports/inventory", ...adminOnly, async (_req, res) => {
  res.json(await Product.find().select("name sku stock price isActive").sort({ stock: 1 }).limit(500));
});
app.get("/api/admin/reports/customers", ...adminOnly, async (_req, res) => {
  res.json(await Order.aggregate([{ $group: { _id: "$user", orderCount: { $sum: 1 }, lifetimeValue: { $sum: "$totals.total" }, lastOrder: { $max: "$createdAt" } } }, { $sort: { lifetimeValue: -1 } }, { $limit: 100 }]));
});
app.get("/api/admin/subscriptions", authenticate, allowRoles("admin", "staff"), async (_req, res) => {
  const { Subscription } = await import("./models/index.js");
  res.json(await Subscription.find().populate("user", "name email").populate("package", "name price").sort({ createdAt: -1 }));
});
app.get("/api/admin/deliveries", authenticate, allowRoles("admin", "staff"), async (_req, res) => {
  res.json(await Order.find({ orderStatus: { $in: ["confirmed", "preparing", "packed", "out_for_delivery"] } }).populate("user", "name phone").sort({ deliveryDate: 1 }));
});
app.patch("/api/admin/deliveries/:orderId/assign", authenticate, allowRoles("admin", "staff"), async (req, res) => {
  const { assignedTo } = z.object({ assignedTo: z.string().refine(validId) }).parse(req.body);
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found." });
  order.set("deliveryAssignee", assignedTo);
  await order.save();
  res.json(order);
});
app.get("/api/admin/suppliers/:id/batches", authenticate, allowRoles("admin", "staff"), async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid supplier id." });
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: "Supplier not found." });
  res.json(await StockBatch.find({ supplier: supplier.id }).populate("product", "name sku").sort({ receivedAt: -1 }));
});

app.use((_req, res) => res.status(404).json({ message: "Route not found." }));
app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: "Please check the submitted information.", errors: error.issues });
  }
  if (error?.code === 11000) return res.status(409).json({ message: "A record with that value already exists." });
  if (error?.name === "ValidationError") return res.status(400).json({ message: "The submitted data is invalid.", errors: Object.values(error.errors).map(({ message }) => message) });
  if (error?.status && error.status < 500) return res.status(error.status).json({ message: error.message });
  console.error(error);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

export default app;
