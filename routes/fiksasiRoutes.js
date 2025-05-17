const express = require("express");
const router = express.Router();
const fiksasiController = require("../controllers/fiksasiController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get("/", authMiddleware.verifyToken, fiksasiController.getAllFiksasi);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateFiksasi,
  fiksasiController.createFiksasi
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validateFiksasi,
  fiksasiController.updateFiksasi
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  fiksasiController.deleteFiksasi
);

module.exports = router;
