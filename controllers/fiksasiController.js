const Fiksasi = require("../models/fiksasiModel");

exports.getAllFiksasi = (req, res) => {
  Fiksasi.findAll((err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    res.json({
      success: true,
      data: results,
      message: "Fiksasi retrieved successfully",
    });
  });
};

exports.createFiksasi = (req, res) => {
  const { nama } = req.body;

  // Check for duplicate nama
  Fiksasi.checkDuplicate(nama, null, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    if (results.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Fiksasi with this nama already exists",
      });
    }

    Fiksasi.create({ nama }, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to create fiksasi",
          error: err.message,
        });
      }
      res.status(201).json({
        success: true,
        data: { id: result.insertId },
        message: "Fiksasi created successfully",
      });
    });
  });
};

exports.updateFiksasi = (req, res) => {
  const { id } = req.params;
  const { nama } = req.body;

  // Check for duplicate nama
  Fiksasi.checkDuplicate(nama, id, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    if (results.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Fiksasi with this nama already exists",
      });
    }

    Fiksasi.update(id, { nama }, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update fiksasi",
          error: err.message,
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Fiksasi not found",
        });
      }
      res.json({
        success: true,
        data: { id },
        message: "Fiksasi updated successfully",
      });
    });
  });
};

exports.deleteFiksasi = (req, res) => {
  const { id } = req.params;

  Fiksasi.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete fiksasi",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Fiksasi not found",
      });
    }
    res.json({
      success: true,
      data: { id },
      message: "Fiksasi deleted successfully",
    });
  });
};
