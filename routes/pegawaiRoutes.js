const express = require("express");
const router = express.Router();
const pegawaiController = require("../controllers/pegawaiController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get("/", authMiddleware.verifyToken, pegawaiController.getAllPegawai);
router.put(
  "/change-password",
  authMiddleware.verifyToken,
  validateMiddleware.validateChangePassword,
  pegawaiController.changePassword
);
router.put(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateUpdatePegawai,
  pegawaiController.updatePegawai
);
router.post("/logout", authMiddleware.verifyToken, pegawaiController.logout);

module.exports = router;
