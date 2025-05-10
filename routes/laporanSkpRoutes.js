const express = require("express");
const router = express.Router();
const laporanSkpController = require("../controllers/laporanSkpController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware.verifyToken,
  laporanSkpController.generateLaporanSkp
);

module.exports = router;
