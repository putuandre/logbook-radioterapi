const express = require("express");
const router = express.Router();
const dokterDpjpController = require("../controllers/dokterDpjpController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get(
  "/",
  authMiddleware.verifyToken,
  dokterDpjpController.getAllDokterDpjp
);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateDokterDpjp,
  dokterDpjpController.createDokterDpjp
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validateDokterDpjp,
  dokterDpjpController.updateDokterDpjp
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  dokterDpjpController.deleteDokterDpjp
);

module.exports = router;
