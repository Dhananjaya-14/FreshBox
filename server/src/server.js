import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT || 5000);

try {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required.");
  }
  await connectDatabase();
  app.listen(port, () => console.log(`FreshBox API listening on http://localhost:${port}`));
} catch (error) {
  console.error("FreshBox API could not start:", error.message);
  process.exitCode = 1;
}
