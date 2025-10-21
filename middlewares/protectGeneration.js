import "dotenv/config";

export const protectGeneration = (req, res, next) => {
  const internalSecret = process.env.KEY_GENERATION_SECRET;
  const providedSecret = req.headers["x-generation-secret"];
  
  if (!internalSecret) {
    // This is a server misconfiguration
    console.error("KEY_GENERATION_SECRET is not set in environment variables.");
    return res.status(500).json({ message: "Server configuration error." });
  }

  if (!providedSecret || providedSecret !== internalSecret) {
    return res.status(403).json({
      message:
        "Forbidden: You do not have permission to perform this action. Dinywa!",
    });
  }

  next();
};
