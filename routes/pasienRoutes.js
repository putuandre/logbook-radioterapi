const express = require("express");
const router = express.Router();
const pasienController = require("../controllers/pasienController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");
const multer = require("multer");

// Konfigurasi multer untuk menyimpan file CSV sementara
const upload = multer({ dest: "uploads/" });

// Semua rute memerlukan autentikasi
router.get("/", authMiddleware.verifyToken, pasienController.getAllPasien);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validatePasien,
  pasienController.createPasien
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validatePasien,
  pasienController.updatePasien
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  pasienController.deletePasien
);
router.post(
  "/import",
  authMiddleware.verifyToken,
  upload.single("file"),
  validateMiddleware.validateCsvUpload,
  pasienController.importPasienCsv
);
router.post(
  "/import-url",
  authMiddleware.verifyToken,
  validateMiddleware.validateCsvUrl,
  pasienController.importPasienCsvFromUrl
);

module.exports = router;
