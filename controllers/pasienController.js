const Pasien = require("../models/pasienModel");
const fs = require("fs");
const { parse } = require("csv-parse");

exports.getAllPasien = (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
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

  Pasien.findAll(search, parsedPage, parsedLimit, (err, { results, total }) => {
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
        pasien: results,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      },
      message: "Pasien retrieved successfully",
    });
  });
};

exports.createPasien = (req, res) => {
  const pasienData = req.body;
  Pasien.create(pasienData, (err, result) => {
    if (err) {
      if (err.message === "Rekam medis already exists") {
        return res.status(409).json({ success: false, message: err.message });
      }
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to create pasien",
          error: err.message,
        });
    }
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: "Pasien created successfully",
    });
  });
};

exports.updatePasien = (req, res) => {
  const { id } = req.params;
  const pasienData = req.body;
  Pasien.update(id, pasienData, (err, result) => {
    if (err) {
      if (err.message === "Rekam medis already exists") {
        return res.status(409).json({ success: false, message: err.message });
      }
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to update pasien",
          error: err.message,
        });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pasien not found" });
    }
    res.json({
      success: true,
      data: { id },
      message: "Pasien updated successfully",
    });
  });
};

exports.deletePasien = (req, res) => {
  const { id } = req.params;
  Pasien.delete(id, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to delete pasien",
          error: err.message,
        });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pasien not found" });
    }
    res.json({
      success: true,
      data: { id },
      message: "Pasien deleted successfully",
    });
  });
};

exports.importPasienCsv = (req, res) => {
  const filePath = req.file.path;
  const results = [];
  const skipped = [];

  fs.createReadStream(filePath)
    .pipe(parse({ columns: true, trim: true }))
    .on("data", (row) => {
      results.push({
        rekam_medis: row.rekam_medis,
        nama_pasien: row.nama_pasien,
        jenis_kelamin: row.jenis_kelamin,
        tgl_lahir: row.tgl_lahir,
        diagnosa: row.diagnosa || null,
      });
    })
    .on("end", () => {
      if (results.length === 0) {
        fs.unlinkSync(filePath);
        return res
          .status(400)
          .json({ success: false, message: "CSV file is empty" });
      }

      // Cek duplikasi rekam_medis
      const rekamMedisList = results.map((r) => r.rekam_medis);
      Pasien.checkMultipleRekamMedis(rekamMedisList, (err, existing) => {
        if (err) {
          fs.unlinkSync(filePath);
          return res
            .status(500)
            .json({
              success: false,
              message: "Database error",
              error: err.message,
            });
        }

        const existingRekamMedis = existing.map((r) => r.rekam_medis);
        const validRows = results.filter(
          (row) => !existingRekamMedis.includes(row.rekam_medis)
        );
        const duplicateRows = results.filter((row) =>
          existingRekamMedis.includes(row.rekam_medis)
        );

        // Tambahkan rekam_medis yang duplikat ke skipped
        skipped.push(
          ...duplicateRows.map((row) => ({
            rekam_medis: row.rekam_medis,
            reason: "Duplicate rekam_medis",
          }))
        );

        if (validRows.length === 0) {
          fs.unlinkSync(filePath);
          return res.json({
            success: true,
            data: {
              imported: 0,
              skipped: skipped.length,
              skippedDetails: skipped,
            },
            message:
              "No new data imported due to duplicate or invalid rekam_medis",
          });
        }

        let importedCount = 0;
        let processed = 0;

        // Validasi dan import data yang valid
        validRows.forEach((row) => {
          if (
            !row.rekam_medis ||
            !row.nama_pasien ||
            !["L", "P"].includes(row.jenis_kelamin) ||
            isNaN(Date.parse(row.tgl_lahir))
          ) {
            skipped.push({
              rekam_medis: row.rekam_medis || "unknown",
              reason: "Invalid data format",
            });
            processed++;
            if (processed === validRows.length) {
              fs.unlinkSync(filePath);
              res.json({
                success: true,
                data: {
                  imported: importedCount,
                  skipped: skipped.length,
                  skippedDetails: skipped,
                },
                message: "CSV import completed",
              });
            }
            return;
          }

          Pasien.create(row, (err, result) => {
            processed++;
            if (!err) {
              importedCount++;
            } else {
              skipped.push({
                rekam_medis: row.rekam_medis,
                reason: err.message || "Database error",
              });
            }

            if (processed === validRows.length) {
              fs.unlinkSync(filePath);
              res.json({
                success: true,
                data: {
                  imported: importedCount,
                  skipped: skipped.length,
                  skippedDetails: skipped,
                },
                message: "CSV import completed",
              });
            }
          });
        });
      });
    })
    .on("error", (err) => {
      fs.unlinkSync(filePath);
      res
        .status(500)
        .json({
          success: false,
          message: "Error parsing CSV",
          error: err.message,
        });
    });
};
