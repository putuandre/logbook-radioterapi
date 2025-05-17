const Planning = require("../models/planningModel");

exports.createPlanning = (req, res) => {
  const {
    rekam_medis,
    dokter_dpjp_id,
    fiksasi_id,
    fraksi,
    active = 1,
  } = req.body;

  // Validate input
  if (!rekam_medis || !dokter_dpjp_id || !fiksasi_id || !fraksi) {
    return res.status(400).json({
      success: false,
      message:
        "Rekam medis, dokter_dpjp_id, fiksasi_id, and fraksi are required",
    });
  }
  if (isNaN(fraksi) || fraksi < 1) {
    return res.status(400).json({
      success: false,
      message: "Fraksi must be a positive number",
    });
  }
  if (![0, 1].includes(parseInt(active))) {
    return res.status(400).json({
      success: false,
      message: "Active must be 0 or 1",
    });
  }

  const planningData = {
    rekam_medis,
    dokter_dpjp_id: parseInt(dokter_dpjp_id),
    fiksasi_id: parseInt(fiksasi_id),
    fraksi: parseInt(fraksi),
    active: parseInt(active),
  };

  // Check for active duplicate
  Planning.checkActiveDuplicate(
    planningData.rekam_medis,
    null,
    (err, results) => {
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
          message:
            "An active planning record for this rekam_medis already exists",
        });
      }

      Planning.create(planningData, (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to create planning",
            error: err.message,
          });
        }
        res.status(201).json({
          success: true,
          data: { id: result.insertId },
          message: "Planning created successfully",
        });
      });
    }
  );
};

exports.getAllPlanning = (req, res) => {
  const { search = "", active, page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const activeFilter = active === "1" ? 1 : active === "0" ? 0 : null;

  if (
    isNaN(parsedPage) ||
    parsedPage < 1 ||
    isNaN(parsedLimit) ||
    parsedLimit < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid page or limit",
    });
  }

  Planning.findAll(
    search,
    activeFilter,
    parsedPage,
    parsedLimit,
    (err, { results, total }) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }
      res.json({
        success: true,
        data: {
          planning: results,
          pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.ceil(total / parsedLimit),
          },
        },
        message: "Planning retrieved successfully",
      });
    }
  );
};

exports.updatePlanning = (req, res) => {
  const { id } = req.params;
  const {
    rekam_medis,
    dokter_dpjp_id,
    fiksasi_id,
    fraksi,
    active = 1,
  } = req.body;

  // Validate input
  if (!rekam_medis || !dokter_dpjp_id || !fiksasi_id || !fraksi) {
    return res.status(400).json({
      success: false,
      message:
        "Rekam medis, dokter_dpjp_id, fiksasi_id, and fraksi are required",
    });
  }
  if (isNaN(fraksi) || fraksi < 1) {
    return res.status(400).json({
      success: false,
      message: "Fraksi must be a positive number",
    });
  }
  if (![0, 1].includes(parseInt(active))) {
    return res.status(400).json({
      success: false,
      message: "Active must be 0 or 1",
    });
  }

  const planningData = {
    rekam_medis,
    dokter_dpjp_id: parseInt(dokter_dpjp_id),
    fiksasi_id: parseInt(fiksasi_id),
    fraksi: parseInt(fraksi),
    active: parseInt(active),
  };

  // Check for active duplicate if setting active to 1
  if (planningData.active === 1) {
    Planning.checkActiveDuplicate(
      planningData.rekam_medis,
      id,
      (err, results) => {
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
            message:
              "An active planning record for this rekam_medis already exists",
          });
        }
        performUpdate();
      }
    );
  } else {
    performUpdate();
  }

  function performUpdate() {
    Planning.update(id, planningData, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update planning",
          error: err.message,
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Planning not found",
        });
      }
      res.json({
        success: true,
        data: { id },
        message: "Planning updated successfully",
      });
    });
  }
};

exports.deletePlanning = (req, res) => {
  const { id } = req.params;

  Planning.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete planning",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Planning not found",
      });
    }
    res.json({
      success: true,
      data: { id },
      message: "Planning deleted successfully",
    });
  });
};
