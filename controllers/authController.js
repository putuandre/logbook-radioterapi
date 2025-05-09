const Pegawai = require("../models/pegawaiModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.register = (req, res) => {
  const pegawaiData = req.body;
  Pegawai.create(pegawaiData, (err, result) => {
    if (err) {
      if (err.message === "NIP or email already exists") {
        return res.status(409).json({ success: false, message: err.message });
      }
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to register pegawai",
          error: err.message,
        });
    }
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: "Pegawai registered successfully",
    });
  });
};

exports.login = (req, res) => {
  const { identifier, password } = req.body;
  Pegawai.findByNipOrEmail(identifier, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Database error",
          error: err.message,
        });
    }
    if (results.length === 0) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Invalid credentials or inactive account",
        });
    }
    const pegawai = results[0];
    bcrypt.compare(password, pegawai.password, (err, isMatch) => {
      if (err) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Error verifying password",
            error: err.message,
          });
      }
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
      const token = jwt.sign(
        {
          id: pegawai.id,
          nip: pegawai.nip,
          email: pegawai.email,
          role: pegawai.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      res.json({
        success: true,
        data: {
          token,
          pegawai: {
            id: pegawai.id,
            nip: pegawai.nip,
            nama_pegawai: pegawai.nama_pegawai,
            email: pegawai.email,
            role: pegawai.role,
          },
        },
        message: "Login successful",
      });
    });
  });
};
