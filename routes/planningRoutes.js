const express = require("express");
const router = express.Router();
const planningController = require("../controllers/planningController");
const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

router.get("/", authMiddleware.verifyToken, planningController.getAllPlanning);
router.post(
  "/",
  authMiddleware.verifyToken,
  validateMiddleware.validatePlanning,
  planningController.createPlanning
);
router.put(
  "/:id",
  authMiddleware.verifyToken,
  validateMiddleware.validatePlanning,
  planningController.updatePlanning
);
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  planningController.deletePlanning
);

module.exports = router;
