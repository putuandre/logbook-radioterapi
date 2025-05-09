const express = require("express");
const router = express.Router();
const skpController = require("../controllers/skpController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get("/", authMiddleware.verifyToken, skpController.getAllSkp);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validateSkp,
  skpController.createSkp
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validateSkp,
  skpController.updateSkp
);
router.delete("/:id", authMiddleware.verifyToken, skpController.deleteSkp);

module.exports = router;
