const express = require("express");
const router = express.Router();
const kaInstalasiController = require("../controllers/kaInstalasiController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get(
  "/",
  authMiddleware.verifyToken,
  kaInstalasiController.getAllKaInstalasi
);
router.get(
  "/:id",
  authMiddleware.verifyToken,
  kaInstalasiController.getKaInstalasiById
);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateKaInstalasi,
  kaInstalasiController.createKaInstalasi
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validateKaInstalasi,
  kaInstalasiController.updateKaInstalasi
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  kaInstalasiController.deleteKaInstalasi
);

module.exports = router;
