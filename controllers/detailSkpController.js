const DetailSkp = require("../models/detailSkpModel");

exports.getDetailSkp = (req, res) => {
  const { skp_id } = req.query;
  const pegawai_id = req.user.id; // Dari JWT

  if (!skp_id || isNaN(skp_id)) {
    return res
      .status(400)
      .json({ success: false, message: "Valid skp_id is required" });
  }

  DetailSkp.findBySkpId(skp_id, pegawai_id, (err, results) => {
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
      data: { detail_skp: results },
      message: "Detail SKP retrieved successfully",
    });
  });
};

exports.createDetailSkp = (req, res) => {
  const pegawai_id = req.user.id; // Dari JWT
  const detailSkpData = {
    skp_id: req.body.skp_id,
    jenis_kegiatan_id: req.body.jenis_kegiatan_id,
    pegawai_id,
  };

  DetailSkp.create(detailSkpData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to create detail SKP",
          error: err.message,
        });
    }
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: "Detail SKP created successfully",
    });
  });
};

exports.deleteDetailSkp = (req, res) => {
  const { id } = req.params;
  const pegawai_id = req.user.id; // Dari JWT

  DetailSkp.delete(id, pegawai_id, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to delete detail SKP",
          error: err.message,
        });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Detail SKP not found or not authorized",
        });
    }
    res.json({
      success: true,
      data: { id },
      message: "Detail SKP deleted successfully",
    });
  });
};
