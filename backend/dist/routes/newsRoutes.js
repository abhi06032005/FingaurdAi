"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const newsController_1 = require("../controllers/newsController");
const router = express_1.default.Router();
router.get('/indian-market', async (req, res) => {
    await (0, newsController_1.getNewsByCategory)(req, res, 'indian-market');
});
router.get('/ipo', async (req, res) => {
    await (0, newsController_1.getNewsByCategory)(req, res, 'ipo');
});
router.get('/global', async (req, res) => {
    await (0, newsController_1.getNewsByCategory)(req, res, 'global');
});
router.get('/earnings', async (req, res) => {
    await (0, newsController_1.getNewsByCategory)(req, res, 'earnings');
});
exports.default = router;
