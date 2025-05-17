const Jadwal = require("../models/jadwalModel");
const { parse } = require("csv-parse");
const fs = require("fs");
const ExcelJS = require("exceljs");

exports.createJadwal = (req, res) => {
  const { rekam_medis, jadwal_date, jadwal_time } = req.body;

  // Validate input
  if (!rekam_medis || !jadwal_date || !jadwal_time) {
    return res.status(400).json({
      success: false,
      message: "Rekam medis, jadwal_date, and jadwal_time are required",
    });
  }
  if (isNaN(Date.parse(jadwal_date))) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_date format",
    });
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(jadwal_time)) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_time format (use HH:MM or HH:MM:SS)",
    });
  }

  const jadwalData = {
    rekam_medis,
    jadwal_date,
    jadwal_time,
  };

  // Step 1: Check for duplicate jadwal_date
  Jadwal.checkDuplicateDate(
    jadwalData.rekam_medis,
    jadwalData.jadwal_date,
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
            "A jadwal record for this rekam_medis and jadwal_date already exists",
        });
      }

      // Step 2: Check for active planning
      Jadwal.checkPlanningActive(
        jadwalData.rekam_medis,
        (err, planningResults) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Database error",
              error: err.message,
            });
          }
          if (planningResults.length === 0) {
            return res.status(400).json({
              success: false,
              message: "No active planning record exists for this rekam_medis",
            });
          }

          // Step 3: Check fraksi limit
          Jadwal.checkFraksiLimit(
            jadwalData.rekam_medis,
            (err, fraksiResults) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Database error",
                  error: err.message,
                });
              }
              const { total_fraksi, jadwal_count } = fraksiResults[0];
              if (jadwal_count >= total_fraksi) {
                return res.status(400).json({
                  success: false,
                  message:
                    "Jadwal count has reached or exceeded the total fraksi for this rekam_medis",
                });
              }

              // Step 4: Create jadwal
              Jadwal.create(jadwalData, (err, result) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: "Failed to create jadwal",
                    error: err.message,
                  });
                }
                res.status(201).json({
                  success: true,
                  data: { id: result.insertId },
                  message: "Jadwal created successfully",
                });
              });
            }
          );
        }
      );
    }
  );
};

exports.getAllJadwal = (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

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

  Jadwal.findAll(search, parsedPage, parsedLimit, (err, { results, total }) => {
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
        jadwal: results,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      },
      message: "Jadwal retrieved successfully",
    });
  });
};

exports.updateJadwal = (req, res) => {
  const { id } = req.params;
  const { jadwal_date, jadwal_time } = req.body;

  // Validate input
  if (!jadwal_date || !jadwal_time) {
    return res.status(400).json({
      success: false,
      message: "Jadwal_date and jadwal_time are required",
    });
  }
  if (isNaN(Date.parse(jadwal_date))) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_date format",
    });
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(jadwal_time)) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_time format (use HH:MM or HH:MM:SS)",
    });
  }

  const jadwalData = {
    jadwal_date,
    jadwal_time,
  };

  // Get rekam_medis for the jadwal
  Jadwal.getById(id, (err, jadwalResults) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message,
      });
    }
    if (jadwalResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jadwal not found",
      });
    }

    const rekam_medis = jadwalResults[0].rekam_medis;

    // Check for duplicate jadwal_date
    Jadwal.checkDuplicateDate(
      rekam_medis,
      jadwalData.jadwal_date,
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
              "A jadwal record for this rekam_medis and jadwal_date already exists",
          });
        }

        Jadwal.update(id, jadwalData, (err, result) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Failed to update jadwal",
              error: err.message,
            });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: "Jadwal not found",
            });
          }
          res.json({
            success: true,
            data: { id },
            message: "Jadwal updated successfully",
          });
        });
      }
    );
  });
};

exports.importJadwalCsv = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No CSV file uploaded",
    });
  }

  const results = [];
  const errors = [];
  let processedRows = 0;
  const totalRows = [];

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const processRow = (row, callback) => {
    const { rekam_medis, jadwal_date, jadwal_time } = row;

    // Validate input
    if (!rekam_medis || !jadwal_date || !jadwal_time) {
      errors.push({
        row: row,
        message: "Rekam medis, jadwal_date, and jadwal_time are required",
      });
      return callback();
    }
    if (isNaN(Date.parse(jadwal_date))) {
      errors.push({ row: row, message: "Invalid jadwal_date format" });
      return callback();
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(jadwal_time)) {
      errors.push({
        row: row,
        message: "Invalid jadwal_time format (use HH:MM or HH:MM:SS)",
      });
      return callback();
    }

    const jadwalData = {
      rekam_medis,
      jadwal_date,
      jadwal_time,
    };

    // Step 1: Check for duplicate jadwal_date
    Jadwal.checkDuplicateDate(
      jadwalData.rekam_medis,
      jadwalData.jadwal_date,
      null,
      (err, duplicateResults) => {
        if (err) {
          errors.push({ row: row, message: `Database error: ${err.message}` });
          return callback();
        }
        if (duplicateResults.length > 0) {
          errors.push({
            row: row,
            message:
              "A jadwal record for this rekam_medis and jadwal_date already exists",
          });
          return callback();
        }

        // Step 2: Check for active planning
        Jadwal.checkPlanningActive(
          jadwalData.rekam_medis,
          (err, planningResults) => {
            if (err) {
              errors.push({
                row: row,
                message: `Database error: ${err.message}`,
              });
              return callback();
            }
            if (planningResults.length === 0) {
              errors.push({
                row: row,
                message:
                  "No active planning record exists for this rekam_medis",
              });
              return callback();
            }

            // Step 3: Check fraksi limit
            Jadwal.checkFraksiLimit(
              jadwalData.rekam_medis,
              (err, fraksiResults) => {
                if (err) {
                  errors.push({
                    row: row,
                    message: `Database error: ${err.message}`,
                  });
                  return callback();
                }
                const { total_fraksi, jadwal_count } = fraksiResults[0];
                if (jadwal_count >= total_fraksi) {
                  errors.push({
                    row: row,
                    message:
                      "Jadwal count has reached or exceeded the total fraksi for this rekam_medis",
                  });
                  return callback();
                }

                // Step 4: Insert valid row
                Jadwal.create(jadwalData, (err, result) => {
                  if (err) {
                    errors.push({
                      row: row,
                      message: `Failed to insert: ${err.message}`,
                    });
                    return callback();
                  }
                  results.push({ id: result.insertId, ...jadwalData });
                  callback();
                });
              }
            );
          }
        );
      }
    );
  };

  fs.createReadStream(req.file.path)
    .pipe(parser)
    .on("data", (row) => {
      totalRows.push(row);
    })
    .on("end", () => {
      if (totalRows.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "CSV file is empty",
        });
      }

      const processNextRow = (index) => {
        if (index >= totalRows.length) {
          fs.unlinkSync(req.file.path);
          return res.status(200).json({
            success: true,
            data: {
              total: totalRows.length,
              inserted: results.length,
              skipped: errors.length,
              errors: errors,
            },
            message: "CSV import completed",
          });
        }

        processRow(totalRows[index], () => {
          processedRows++;
          processNextRow(index + 1);
        });
      };

      processNextRow(0);
    })
    .on("error", (err) => {
      fs.unlinkSync(req.file.path);
      res.status(500).json({
        success: false,
        message: "Failed to parse CSV",
        error: err.message,
      });
    });
};

exports.deleteJadwal = (req, res) => {
  const { id } = req.params;

  Jadwal.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete jadwal",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Jadwal not found",
      });
    }
    res.json({
      success: true,
      data: { id },
      message: "Jadwal deleted successfully",
    });
  });
};

exports.exportPlanningExcel = async (req, res) => {
  try {
    // Fetch data
    const results = await new Promise((resolve, reject) => {
      Jadwal.findPlanningForExport((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Planning Active");

    // Define columns
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Rekam Medis", key: "rekam_medis", width: 15 },
      { header: "Nama Pasien", key: "nama_pasien", width: 20 },
      { header: "Diagnosa", key: "diagnosa", width: 30 },
      { header: "Nama Fiksasi", key: "nama_fiksasi", width: 20 },
      { header: "Nama Dokter DPJP", key: "nama_dokter_dpjp", width: 20 },
      { header: "Fraksi (Active)", key: "fraksi_active", width: 15 },
      { header: "Sisa Fraksi", key: "sisa_fraksi", width: 15 },
    ];

    // Add rows
    results.forEach((row, index) => {
      worksheet.addRow({
        no: index + 1,
        rekam_medis: row.rekam_medis,
        nama_pasien: row.nama_pasien,
        diagnosa: row.diagnosa,
        nama_fiksasi: row.nama_fiksasi,
        nama_dokter_dpjp: row.nama_dokter_dpjp,
        fraksi_active: row.fraksi_active,
        sisa_fraksi: row.sisa_fraksi,
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D3D3D3" },
    };

    // Generate file
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const fileName = `planning_export_${timestamp}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to export Excel",
      error: err.message,
    });
  }
};
