"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clerk_controller_1 = require("../controllers/clerk.controller");
const router = (0, express_1.Router)();
router.post("/sync", clerk_controller_1.syncUser);
exports.default = router;
