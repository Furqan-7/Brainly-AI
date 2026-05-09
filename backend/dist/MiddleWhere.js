"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddleWhere = MiddleWhere;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function MiddleWhere(req, res, next) {
    const token = req.headers.token;
    if (!token || typeof token !== 'string') {
        return res.status(411).json({
            message: "Invalid Token"
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_TOKEN);
        if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
            return res.status(403).json({
                message: "Invalid Token"
            });
        }
        res.locals.userId = decoded.userId;
        next();
    }
    catch (e) {
        return res.status(403).json({
            message: "Invalid or Expired Token"
        });
    }
}
//# sourceMappingURL=MiddleWhere.js.map