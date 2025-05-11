const express = require("express");
const router = express.Router();
const laporanLogbookController = require("../controllers/laporanLogbookController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware.verifyToken,
  laporanLogbookController.generateLaporanLogbook
);

module.exports = router;
