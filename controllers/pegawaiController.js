const Pegawai = require("../models/pegawaiModel");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");

exports.getAllPegawai = (req, res) => {
  Pegawai.findAllActive((err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pegawai",
        error: err.message,
      });
    }
    res.status(200).json({
      success: true,
      data: results,
      message: "Pegawai retrieved successfully",
    });
  });
};

exports.changePassword = (req, res) => {
  const { current_password, new_password } = req.body;
  const pegawai_id = req.user.id; // Dari JWT

  // Validasi input
  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  // Ambil data pegawai untuk verifikasi kata sandi saat ini
  Pegawai.findByIdWithPassword(pegawai_id, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pegawai not found or inactive",
      });
    }

    const pegawai = results[0];
    // Verifikasi kata sandi saat ini
    bcrypt.compare(current_password, pegawai.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error verifying password",
          error: err.message,
        });
      }
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update kata sandi baru
      Pegawai.updatePassword(pegawai_id, new_password, (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to change password",
            error: err.message,
          });
        }
        res.status(200).json({
          success: true,
          message: "Password changed successfully",
        });
      });
    });
  });
};

exports.updatePegawai = (req, res) => {
  const pegawai_id = req.user.id; // Dari JWT
  const pegawaiData = req.body;

  // Validasi input minimal
  if (
    !pegawaiData.nip ||
    !pegawaiData.nama_pegawai ||
    !pegawaiData.jabatan ||
    !pegawaiData.unit_kerja ||
    !pegawaiData.email ||
    !pegawaiData.role
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided",
    });
  }

  Pegawai.update(pegawai_id, pegawaiData, (err, result) => {
    if (err) {
      if (err.message === "NIP or email already exists") {
        return res.status(409).json({
          success: false,
          message: err.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to update pegawai",
        error: err.message,
      });
    }
    res.status(200).json({
      success: true,
      message: "Pegawai updated successfully",
    });
  });
};

exports.logout = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "No token provided",
    });
  }

  // Decode token untuk mendapatkan waktu kedaluwarsa
  const decoded = require("jsonwebtoken").decode(token);
  if (!decoded || !decoded.exp) {
    return res.status(400).json({
      success: false,
      message: "Invalid token",
    });
  }

  const expiry = new Date(decoded.exp * 1000); // Konversi detik ke milidetik

  // Tambahkan token ke blacklist
  pool.query(
    "INSERT INTO blacklisted_tokens (token, expiry) VALUES (?, ?)",
    [token, expiry],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to blacklist token",
          error: err.message,
        });
      }
      res.status(200).json({
        success: true,
        message: "Logout successful. Please remove the token from client.",
      });
    }
  );
};

module.exports = exports;
