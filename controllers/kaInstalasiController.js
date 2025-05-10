const KaInstalasi = require("../models/kaInstalasiModel");

exports.getAllKaInstalasi = (req, res) => {
  const { active } = req.query;
  const parsedActive = active === "1" ? 1 : undefined; // Hanya terima active=1

  KaInstalasi.findAll(parsedActive, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    res.json({
      success: true,
      data: { ka_instalasi: results },
      message: "Ka Instalasi retrieved successfully",
    });
  });
};

exports.getKaInstalasiById = (req, res) => {
  const { id } = req.params;

  KaInstalasi.findById(id, (err, results) => {
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
        .status(404)
        .json({ success: false, message: "Ka Instalasi not found" });
    }
    res.json({
      success: true,
      data: { ka_instalasi: results[0] },
      message: "Ka Instalasi retrieved successfully",
    });
  });
};

exports.createKaInstalasi = (req, res) => {
  const kaInstalasiData = {
    nama: req.body.nama,
    nip: req.body.nip,
    jabatan: req.body.jabatan,
    sip: req.body.sip,
    active: req.body.active !== undefined ? parseInt(req.body.active) : 1,
  };

  KaInstalasi.create(kaInstalasiData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create ka instalasi",
        error: err.message,
      });
    }
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: "Ka Instalasi created successfully",
    });
  });
};

exports.updateKaInstalasi = (req, res) => {
  const { id } = req.params;
  const kaInstalasiData = {
    nama: req.body.nama,
    nip: req.body.nip,
    jabatan: req.body.jabatan,
    sip: req.body.sip,
    active: req.body.active !== undefined ? parseInt(req.body.active) : 1,
  };

  KaInstalasi.update(id, kaInstalasiData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update ka instalasi",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Ka Instalasi not found" });
    }
    res.json({
      success: true,
      data: { id },
      message: "Ka Instalasi updated successfully",
    });
  });
};

exports.deleteKaInstalasi = (req, res) => {
  const { id } = req.params;

  KaInstalasi.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete ka instalasi",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Ka Instalasi not found" });
    }
    res.json({
      success: true,
      data: { id },
      message: "Ka Instalasi deleted successfully",
    });
  });
};
