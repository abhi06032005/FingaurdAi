"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const AppError_1 = require("../utils/AppError");
const env_1 = require("../config/env");
class AuthService {
    static async register(data) {
        const existingUser = await user_repository_1.UserRepository.findByEmail(data.email);
        if (existingUser) {
            throw new AppError_1.AppError('Email is already registered', 400);
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        const user = await user_repository_1.UserRepository.create({
            ...data,
            password: hashedPassword,
        });
        const token = this.generateToken(user.id, user.role);
        // Omit password from return
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    static async login(data) {
        const user = await user_repository_1.UserRepository.findByEmail(data.email);
        if (!user) {
            throw new AppError_1.AppError('Invalid credentials', 401);
        }
        const isMatch = await bcrypt_1.default.compare(data.password, user.password);
        if (!isMatch) {
            throw new AppError_1.AppError('Invalid credentials', 401);
        }
        const token = this.generateToken(user.id, user.role);
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    static generateToken(id, role) {
        return jsonwebtoken_1.default.sign({ id, role }, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
    }
}
exports.AuthService = AuthService;
