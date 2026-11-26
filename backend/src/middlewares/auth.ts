import { NextFunction, Request, Response } from "express";
import User, { IUser, UserRole } from "../models/user";
import { verifyToken } from "../modules/auth/auth.service";

// Thêm req.user vào kiểu Request của Express
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Yêu cầu đăng nhập: đọc "Authorization: Bearer <token>"
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập"
    });
    return;
  }

  try {
    const userId = verifyToken(header.slice(7));

    // Đọc lại từ DB để role luôn mới nhất và tài khoản đã xóa không còn dùng được
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại"
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
    });
  }
};

// Giới hạn theo vai trò, dùng sau authenticate
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác này"
      });
      return;
    }

    next();
  };