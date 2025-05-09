const express = require("express");
const router = express.Router();
const jenisKegiatanController = require("../controllers/jenisKegiatanController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get(
  "/",
  authMiddleware.verifyToken,
  jenisKegiatanController.getAllJenisKegiatan
);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateJenisKegiatan,
  jenisKegiatanController.createJenisKegiatan
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validateJenisKegiatan,
  jenisKegiatanController.updateJenisKegiatan
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  jenisKegiatanController.deleteJenisKegiatan
);

module.exports = router;
