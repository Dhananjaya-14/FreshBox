import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  Category, DeliveryArea, DeliverySlot, Package, Product, User
} from "./models/index.js";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Set MONGODB_URI in server/.env before running the seed script.");

const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
if (Boolean(adminEmail) !== Boolean(adminPassword)) {
  throw new Error("Set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env.");
}
if (adminPassword && adminPassword.length < 12) {
  throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
}

await mongoose.connect(uri);

const categoryData = [
  { name: "Fresh Fruits", slug: "fresh-fruits", description: "Seasonal fruit from local growers." },
  { name: "Fresh Vegetables", slug: "fresh-vegetables", description: "Freshly picked vegetables for everyday cooking." },
  { name: "Organic Produce", slug: "organic-produce", description: "Carefully grown organic selections." }
];
const categories = {};
for (const data of categoryData) {
  categories[data.slug] = await Category.findOneAndUpdate({ slug: data.slug }, { $setOnInsert: data }, { upsert: true, new: true });
}

const productData = [
  { name: "Ceylon Avocado", sku: "FB-AVO-001", category: categories["fresh-fruits"].id, description: "Creamy, locally grown avocados picked at their best.", price: 450, unit: "item", stock: 24, isFeatured: true },
  { name: "Sweet Oranges", sku: "FB-ORG-001", category: categories["fresh-fruits"].id, description: "Juicy, bright oranges for a refreshing everyday pick.", price: 380, unit: "kg", stock: 32, isFeatured: true },
  { name: "Garden Carrots", sku: "FB-CAR-001", category: categories["fresh-vegetables"].id, description: "Naturally sweet carrots, fresh from the soil.", price: 320, unit: "kg", stock: 18 },
  { name: "Green Leafy Mix", sku: "FB-LEA-001", category: categories["organic-produce"].id, description: "A seasonal mix of crisp local greens.", price: 550, unit: "pack", stock: 14, isOrganic: true, isFeatured: true },
  { name: "Ripe Tomatoes", sku: "FB-TOM-001", category: categories["fresh-vegetables"].id, description: "Vibrant, sun-ripened tomatoes for your table.", price: 420, unit: "kg", stock: 22 }
];
const products = {};
for (const data of productData) {
  products[data.sku] = await Product.findOneAndUpdate({ sku: data.sku }, { $setOnInsert: data }, { upsert: true, new: true });
}

const packageData = [
  { name: "Mini FreshBox", description: "A little bit of fresh for the week ahead.", price: 2500, packageType: "mini", includedItems: [{ product: products["FB-AVO-001"].id, quantity: 1 }, { product: products["FB-CAR-001"].id, quantity: 2 }] },
  { name: "Family Fresh Produce Box", description: "The family favourites, all in one box.", price: 5000, packageType: "family", includedItems: [{ product: products["FB-ORG-001"].id, quantity: 2 }, { product: products["FB-TOM-001"].id, quantity: 2 }] },
  { name: "Premium Organic Produce Box", description: "A thoughtfully picked organic selection.", price: 7000, packageType: "premium", includedItems: [{ product: products["FB-LEA-001"].id, quantity: 2 }] }
];
for (const data of packageData) {
  await Package.findOneAndUpdate({ name: data.name }, { $setOnInsert: data }, { upsert: true, new: true });
}

await DeliveryArea.findOneAndUpdate(
  { name: "Colombo (development sample)" },
  { $setOnInsert: { name: "Colombo (development sample)", districts: ["Colombo"], fee: 350, minimumOrder: 0, isActive: true } },
  { upsert: true }
);

for (let offset = 1; offset <= 7; offset += 1) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setUTCHours(0, 0, 0, 0);
  for (const [startTime, endTime] of [["09:00", "12:00"], ["14:00", "17:00"]]) {
    await DeliverySlot.findOneAndUpdate(
      { date, startTime, endTime },
      { $setOnInsert: { date, startTime, endTime, capacity: 20, isActive: true } },
      { upsert: true }
    );
  }
}

if (adminEmail && adminPassword) {
  const user = await User.findOne({ email: adminEmail }).select("+passwordHash");
  if (!user) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({ name: process.env.SEED_ADMIN_NAME || "FreshBox Admin", email: adminEmail, passwordHash, role: "admin" });
    console.log("Created the configured FreshBox administrator account.");
  } else {
    if (!(await bcrypt.compare(adminPassword, user.passwordHash))) {
      throw new Error("The configured admin email already exists with a different password. Use that account's password to seed its admin role, or choose another email.");
    }
    user.role = "admin";
    user.status = "active";
    user.refreshVersion += 1;
    await user.save();
    console.log("Promoted the verified configured account to administrator.");
  }
} else {
  console.log("No admin account created. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env and run the seed script again.");
}

console.log("FreshBox sample catalogue, packages, and development delivery options are ready.");
await mongoose.disconnect();
