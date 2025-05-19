const express = require("express");
const router = express.Router();
const jadwalController = require("../controllers/jadwalController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/", authMiddleware.verifyToken, jadwalController.getAllJadwal);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateJadwal,
  jadwalController.createJadwal
);
router.post(
  "/import",
  authMiddleware.verifyToken,
  upload.single("file"),
  validateMiddleware.validateCsvUpload,
  jadwalController.importJadwalCsv
);
router.post(
  "/import-url",
  authMiddleware.verifyToken,
  validateMiddleware.validateCsvUrl,
  jadwalController.importJadwalCsvFromUrl
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validateEditJadwal,
  jadwalController.updateJadwal
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  jadwalController.deleteJadwal
);
router.get(
  "/export",
  authMiddleware.verifyToken,
  jadwalController.exportPlanningExcel
);

module.exports = router;
