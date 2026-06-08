"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const prisma_1 = require("../config/prisma");
class UserRepository {
    static async create(data) {
        return prisma_1.prisma.user.create({ data });
    }
    static async findByEmail(email) {
        return prisma_1.prisma.user.findUnique({ where: { email } });
    }
    static async findById(id) {
        return prisma_1.prisma.user.findUnique({ where: { id } });
    }
}
exports.UserRepository = UserRepository;
