const express = require("express");
const router = express.Router();
const kegiatanController = require("../controllers/kegiatanController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", authMiddleware.verifyToken, kegiatanController.getAllKegiatan);
router.get(
  "/count-by-skp",
  authMiddleware.verifyToken,
  kegiatanController.getKegiatanCountBySkp
);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateKegiatan,
  kegiatanController.createKegiatan
);
router.post(
  "/import",
  authMiddleware.verifyToken,
  upload.single("file"),
  validateMiddleware.validateCsvUpload,
  kegiatanController.importCsv
);
router.post(
  "/import-url",
  authMiddleware.verifyToken,
  validateMiddleware.validateCsvUrl,
  kegiatanController.importCsvFromUrl
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validateEditKegiatan,
  kegiatanController.updateKegiatan
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  kegiatanController.deleteKegiatan
);

module.exports = router;
