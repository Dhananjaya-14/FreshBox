import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128)
});
const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional()
});

function tokensFor(user) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );
  const refreshToken = jwt.sign(
    { sub: user.id, version: user.refreshVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );
  return { accessToken, refreshToken };
}

function setRefreshCookie(res, token) {
  res.cookie("freshbox_refresh", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, addresses: user.addresses };
}

router.post("/register", async (req, res) => {
  const input = registrationSchema.parse(req.body);
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ name: input.name, email, phone: input.phone, passwordHash });
  const tokens = tokensFor(user);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(201).json({ user: publicUser(user), accessToken: tokens.accessToken });
});

router.post("/login", async (req, res) => {
  const input = credentialsSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  if (!user || user.status !== "active" || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }

  const tokens = tokensFor(user);
  setRefreshCookie(res, tokens.refreshToken);
  res.json({ user: publicUser(user), accessToken: tokens.accessToken });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies.freshbox_refresh;
  if (!token) {
    return res.status(401).json({ message: "Sign in to continue." });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active" || payload.version !== user.refreshVersion) {
      return res.status(401).json({ message: "Your session has expired. Sign in again." });
    }
    user.refreshVersion += 1;
    await user.save();
    const tokens = tokensFor(user);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user: publicUser(user), accessToken: tokens.accessToken });
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your session has expired. Sign in again." });
    }
    throw error;
  }
});

router.post("/logout", async (req, res) => {
  const token = req.cookies.freshbox_refresh;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(payload.sub, { $inc: { refreshVersion: 1 } });
    } catch (error) {
      if (error.name !== "TokenExpiredError" && error.name !== "JsonWebTokenError") throw error;
    }
  }
  res.clearCookie("freshbox_refresh", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth"
  });
  res.json({ message: "Signed out." });
});

router.get("/me", authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
