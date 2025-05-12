const express = require("express");
const router = express.Router();
const kegiatanController = require("../controllers/kegiatanController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

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
