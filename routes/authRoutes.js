const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validateMiddleware = require("../middleware/validateMiddleware");

router.post(
  "/register",
  validateMiddleware.validateRegister,
  authController.register
);
router.post("/login", validateMiddleware.validateLogin, authController.login);

module.exports = router;
