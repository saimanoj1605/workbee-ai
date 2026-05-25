import express from "express";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const port = 5000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("WorkBee API Running");
});

app.use("/api", userRoutes);

app.listen(port, () => {
  console.log("Server running on port 5000");
});
