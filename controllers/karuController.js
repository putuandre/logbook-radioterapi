const Karu = require("../models/karuModel");
const fs = require("fs").promises;
const path = require("path");

exports.getAllKaru = (req, res) => {
  const { active } = req.query;
  const parsedActive = active === "1" ? 1 : undefined; // Hanya terima active=1

  Karu.findAll(parsedActive, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Database error",
          error: err.message,
        });
    }
    res.json({
      success: true,
      data: { karu: results },
      message: "Karu retrieved successfully",
    });
  });
};

exports.createKaru = (req, res) => {
  const karuData = {
    nama: req.body.nama,
    nip: req.body.nip,
    jabatan: req.body.jabatan,
    ttd: req.file ? `/uploads/ttd/${req.file.filename}` : null,
    active: req.body.active !== undefined ? parseInt(req.body.active) : 1,
  };

  Karu.create(karuData, (err, result) => {
    if (err) {
      if (req.file) {
        fs.unlink(path.join(__dirname, "..", karuData.ttd)).catch(
          console.error
        );
      }
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to create karu",
          error: err.message,
        });
    }
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: "Karu created successfully",
    });
  });
};

exports.updateKaru = async (req, res) => {
  const { id } = req.params;

  // Ambil data karu lama untuk ttd
  const [rows] = await new Promise((resolve, reject) => {
    Karu.findById(id, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });

  if (!rows) {
    if (req.file) {
      await fs
        .unlink(path.join(__dirname, "..", `/uploads/ttd/${req.file.filename}`))
        .catch(console.error);
    }
    return res.status(404).json({ success: false, message: "Karu not found" });
  }

  const karuData = {
    nama: req.body.nama,
    nip: req.body.nip,
    jabatan: req.body.jabatan,
    ttd: req.file ? `/uploads/ttd/${req.file.filename}` : rows.ttd, // Gunakan ttd lama jika tidak ada file baru
    active: req.body.active !== undefined ? parseInt(req.body.active) : 1,
  };

  Karu.update(id, karuData, async (err, result) => {
    if (err) {
      if (req.file) {
        await fs
          .unlink(path.join(__dirname, "..", karuData.ttd))
          .catch(console.error);
      }
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to update karu",
          error: err.message,
        });
    }
    if (result.affectedRows === 0) {
      if (req.file) {
        await fs
          .unlink(path.join(__dirname, "..", karuData.ttd))
          .catch(console.error);
      }
      return res
        .status(404)
        .json({ success: false, message: "Karu not found" });
    }

    // Hapus file ttd lama hanya jika ada file baru
    if (req.file && rows.ttd) {
      await fs
        .unlink(path.join(__dirname, "..", rows.ttd))
        .catch(console.error);
    }

    res.json({
      success: true,
      data: { id },
      message: "Karu updated successfully",
    });
  });
};

exports.deleteKaru = async (req, res) => {
  const { id } = req.params;

  // Ambil ttd untuk dihapus
  const [rows] = await new Promise((resolve, reject) => {
    Karu.findById(id, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });

  Karu.delete(id, async (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to delete karu",
          error: err.message,
        });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Karu not found" });
    }

    // Hapus file ttd
    if (rows && rows.ttd) {
      await fs
        .unlink(path.join(__dirname, "..", rows.ttd))
        .catch(console.error);
    }

    res.json({
      success: true,
      data: { id },
      message: "Karu deleted successfully",
    });
  });
};
