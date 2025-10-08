
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import lipaNaMpesaRoutes from "./routes/routes.lipanampesa.js";
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import './firebase.js'; // Initialize Firebase

const app = express();

// CORS configuration for development
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
};

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
app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter);

app.get("/", (req, res) => {
  res.send("AirPesa Biih!!!");
});

// Route handlers
app.use("/api/auth", apiKeyRoutes);
app.use("/api/mpesa", lipaNaMpesaRoutes);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
