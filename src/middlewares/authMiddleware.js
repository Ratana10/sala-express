const jwt = require("jsonwebtoken");


const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Expect: "Bearer TOKEN"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, "ratana-system");
    req.user = decoded;
    next();
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
