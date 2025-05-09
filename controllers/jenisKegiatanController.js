const JenisKegiatan = require("../models/jenisKegiatanModel");

exports.getAllJenisKegiatan = (req, res) => {
  const { search = "", tingkat_kegiatan, page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

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

  JenisKegiatan.findAll(
    search,
    tingkat_kegiatan,
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
          jenis_kegiatan: results,
          pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.ceil(total / parsedLimit),
          },
        },
        message: "Jenis kegiatan retrieved successfully",
      });
    }
  );
};

exports.createJenisKegiatan = (req, res) => {
  const jenisKegiatanData = {
    tingkat_kegiatan: req.body.tingkat_kegiatan,
    nama_kegiatan: req.body.nama_kegiatan,
    active: 1, // Default active = 1
  };

  JenisKegiatan.create(jenisKegiatanData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to create jenis kegiatan",
          error: err.message,
        });
    }
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: "Jenis kegiatan created successfully",
    });
  });
};

exports.updateJenisKegiatan = (req, res) => {
  const { id } = req.params;
  const jenisKegiatanData = {
    tingkat_kegiatan: req.body.tingkat_kegiatan,
    nama_kegiatan: req.body.nama_kegiatan,
    active: req.body.active !== undefined ? req.body.active : 1,
  };

  JenisKegiatan.update(id, jenisKegiatanData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to update jenis kegiatan",
          error: err.message,
        });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Jenis kegiatan not found" });
    }
    res.json({
      success: true,
      data: { id },
      message: "Jenis kegiatan updated successfully",
    });
  });
};

exports.deleteJenisKegiatan = (req, res) => {
  const { id } = req.params;

  JenisKegiatan.delete(id, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to delete jenis kegiatan",
          error: err.message,
        });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Jenis kegiatan not found" });
    }
    res.json({
      success: true,
      data: { id },
      message: "Jenis kegiatan deleted successfully",
    });
  });
};
