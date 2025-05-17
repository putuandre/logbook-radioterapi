const DokterDpjp = require("../models/dokterDpjpModel");

exports.getAllDokterDpjp = (req, res) => {
  const { active } = req.query;
  const activeFilter = active === "1" ? true : false;

  DokterDpjp.findAll(activeFilter, (err, results) => {
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
      message: "Dokter DPJP retrieved successfully",
    });
  });
};

exports.createDokterDpjp = (req, res) => {
  const { nama, active = 1 } = req.body;

  // Validate active
  if (![0, 1].includes(parseInt(active))) {
    return res.status(400).json({
      success: false,
      message: "Active must be 0 or 1",
    });
  }

  const dokterData = {
    nama,
    active: parseInt(active),
  };

  // Check for duplicate nama
  DokterDpjp.checkDuplicate(dokterData.nama, null, (err, results) => {
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
        message: "Dokter DPJP with this nama already exists",
      });
    }

    DokterDpjp.create(dokterData, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to create dokter DPJP",
          error: err.message,
        });
      }
      res.status(201).json({
        success: true,
        data: { id: result.insertId },
        message: "Dokter DPJP created successfully",
      });
    });
  });
};

exports.updateDokterDpjp = (req, res) => {
  const { id } = req.params;
  const { nama, active = 1 } = req.body;

  // Validate active
  if (![0, 1].includes(parseInt(active))) {
    return res.status(400).json({
      success: false,
      message: "Active must be 0 or 1",
    });
  }

  const dokterData = {
    nama,
    active: parseInt(active),
  };

  // Check for duplicate nama
  DokterDpjp.checkDuplicate(dokterData.nama, id, (err, results) => {
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
        message: "Dokter DPJP with this nama already exists",
      });
    }

    DokterDpjp.update(id, dokterData, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update dokter DPJP",
          error: err.message,
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Dokter DPJP not found",
        });
      }
      res.json({
        success: true,
        data: { id },
        message: "Dokter DPJP updated successfully",
      });
    });
  });
};

exports.deleteDokterDpjp = (req, res) => {
  const { id } = req.params;

  DokterDpjp.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete dokter DPJP",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Dokter DPJP not found",
      });
    }
    res.json({
      success: true,
      data: { id },
      message: "Dokter DPJP deleted successfully",
    });
  });
};
