"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlSchema = void 0;
const tslib_1 = require("tslib");
const zod_1 = tslib_1.__importDefault(require("zod"));
exports.urlSchema = zod_1.default.string().url();
//# sourceMappingURL=types.js.map