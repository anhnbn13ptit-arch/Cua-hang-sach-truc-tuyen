import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import type { IUser } from "../../models/user";

const SALT_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (
  password: string,
  hash: string
): Promise<boolean> => bcrypt.compare(password, hash);

// Hash giả để thời gian phản hồi giống nhau dù email có tồn tại hay không
export const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }

  return secret;
};

// Gọi lúc khởi động server để lỗi cấu hình lộ ra sớm
export const assertAuthConfig = (): void => {
  getSecret();
};

export const signToken = (user: IUser): string =>
  jwt.sign({ sub: user._id.toString() }, getSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"]
  });

// Trả về id của user trong token
export const verifyToken = (token: string): string => {
  const decoded = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });

  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Invalid token");
  }

  return decoded.sub;
};

export const toPublicUser = (user: IUser) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role
});