const Skp = require("../models/skpModel");

exports.getAllSkp = (req, res) => {
  const { search = "", active, page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const pegawai_id = req.user.id; // Dari JWT
  const parsedActive = active === "1" ? 1 : undefined; // Hanya terima active=1, jika tidak, abaikan filter

  if (
    isNaN(parsedPage) ||
    parsedPage < 1 ||
    isNaN(parsedLimit) ||
    parsedLimit < 1
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid page or limit" });
  }

  Skp.findAll(
    pegawai_id,
    search,
    parsedActive,
    parsedPage,
    parsedLimit,
    (err, { results, total }) => {
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
        data: {
          skp: results,
          pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.ceil(total / parsedLimit),
          },
        },
        message: "SKP retrieved successfully",
      });
    }
  );
};

exports.createSkp = (req, res) => {
  const pegawai_id = req.user.id; // Dari JWT
  const skpData = {
    pegawai_id,
    kegiatan_skp: req.body.kegiatan_skp,
    periode_tahun: req.body.periode_tahun,
    deskripsi: req.body.deskripsi,
    active: 1, // Default active = 1
  };

  Skp.create(skpData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create SKP",
        error: err.message,
      });
    }
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: "SKP created successfully",
    });
  });
};

exports.updateSkp = (req, res) => {
  const { id } = req.params;
  const pegawai_id = req.user.id; // Dari JWT
  const skpData = {
    kegiatan_skp: req.body.kegiatan_skp,
    periode_tahun: req.body.periode_tahun,
    deskripsi: req.body.deskripsi,
    active: req.body.active !== undefined ? req.body.active : 1,
  };

  Skp.update(id, pegawai_id, skpData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update SKP",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "SKP not found or not authorized" });
    }
    res.json({
      success: true,
      data: { id },
      message: "SKP updated successfully",
    });
  });
};

exports.deleteSkp = (req, res) => {
  const { id } = req.params;
  const pegawai_id = req.user.id; // Dari JWT

  Skp.delete(id, pegawai_id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete SKP",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "SKP not found or not authorized" });
    }
    res.json({
      success: true,
      data: { id },
      message: "SKP deleted successfully",
    });
  });
};
