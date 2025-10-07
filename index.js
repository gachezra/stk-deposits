import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import lipaNaMpesaRoutes from "./routes/routes.lipanampesa.js";

const app = express();

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message: "Too many requests, chill out for a bit 🚫",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply middleware
app.use(express.json());
app.use(cors());
app.use(limiter);

app.get("/", (req, res) => {
  res.send("AirPesa Biih!!!");
});

// Route handlers
app.use("/api/mpesa", lipaNaMpesaRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
