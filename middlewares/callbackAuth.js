module.exports = (req, res, next) => {
    const secret = process.env.CALLBACK_SECRET;
    const requestSecret = req.headers['x-callback-secret'];
    if (secret && requestSecret && secret === requestSecret) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized callback" });
    }
  };
  