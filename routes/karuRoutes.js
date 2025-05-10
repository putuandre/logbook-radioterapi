const express = require("express");
const router = express.Router();
const karuController = require("../controllers/karuController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");
const multer = require("multer");
const path = require("path");

// Konfigurasi multer untuk upload ttd
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/ttd/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.get("/", authMiddleware.verifyToken, karuController.getAllKaru);
router.get("/:id", authMiddleware.verifyToken, karuController.getKaruById);
router.post(
  "/",
  authMiddleware.verifyToken,
  upload.single("ttd"),
  validateMiddleware.validateKaru,
  karuController.createKaru
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  upload.single("ttd"),
  validateMiddleware.validateKaru,
  karuController.updateKaru
);
router.delete("/:id", authMiddleware.verifyToken, karuController.deleteKaru);

module.exports = router;
