import express from "express";
import prisma from "../config/prisma.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export default router;
