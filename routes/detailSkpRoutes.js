const express = require("express");
const router = express.Router();
const detailSkpController = require("../controllers/detailSkpController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get("/", authMiddleware.verifyToken, detailSkpController.getDetailSkp);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateDetailSkp,
  detailSkpController.createDetailSkp
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  detailSkpController.deleteDetailSkp
);

module.exports = router;
