const jwt = require("jsonwebtoken");
const pool = require("../config/database");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  // Periksa apakah token ada di blacklist
  pool.query(
    "SELECT token FROM blacklisted_tokens WHERE token = ?",
    [token],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Database error",
            error: err.message,
          });
      }
      if (results.length > 0) {
        return res
          .status(401)
          .json({ success: false, message: "Token has been blacklisted" });
      }

      // Verifikasi token JWT
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid token" });
        }
        req.user = decoded;
        next();
      });
    }
  );
};
