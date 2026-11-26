import { Request, Response } from "express";
import User from "../../models/user";
import {
  DUMMY_HASH,
  comparePassword,
  hashPassword,
  signToken,
  toPublicUser
} from "./auth.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 50
    ) {
      res.status(400).json({
        success: false,
        message: "Tên phải từ 2 đến 50 ký tự"
      });
      return;
    }

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: "Email không hợp lệ"
      });
      return;
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      res.status(400).json({
        success: false,
        message: "Mật khẩu phải từ 8 đến 72 ký tự"
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký"
      });
      return;
    }

    // Luôn tạo role "user", không bao giờ nhận role từ client
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await hashPassword(password),
      role: "user"
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        token: signToken(user),
        user: toPublicUser(user)
      }
    });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký"
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Không thể đăng ký, vui lòng thử lại sau"
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mật khẩu"
      });
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    const isMatch = await comparePassword(
      password,
      user?.password ?? DUMMY_HASH
    );

    // Dùng chung một thông báo để không lộ email nào đã đăng ký
    if (!user || !isMatch) {
      res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng"
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        token: signToken(user),
        user: toPublicUser(user)
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Không thể đăng nhập, vui lòng thử lại sau"
    });
  }
};

// Lấy thông tin tài khoản đang đăng nhập
export const getMe = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập"
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: toPublicUser(req.user)
  });
};