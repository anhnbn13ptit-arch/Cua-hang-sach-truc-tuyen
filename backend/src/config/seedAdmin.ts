import User from "../models/user";
import { hashPassword } from "../modules/auth/auth.service";

// Tạo tài khoản admin từ biến môi trường nếu chưa có
const seedAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed");
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long");
  }

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`Promoted ${email} to admin`);
    }
    return;
  }

  await User.create({
    name: process.env.ADMIN_NAME?.trim() || "Admin",
    email,
    password: await hashPassword(password),
    role: "admin"
  });

  console.log(`Admin account created: ${email}`);
};

export default seedAdmin;