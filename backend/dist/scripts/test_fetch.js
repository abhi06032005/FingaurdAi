"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function testFetch() {
    try {
        const response = await axios_1.default.get('http://127.0.0.1:5000/symbol/SIEMENS');
        console.log("Response status:", response.status);
        console.log("Response keys:", Object.keys(response.data));
    }
    catch (err) {
        console.error("Fetch error detailed:", err);
    }
}
testFetch();
