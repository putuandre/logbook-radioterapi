const Kegiatan = require("../models/kegiatanModel");
const pool = require("../config/database"); // Impor pool untuk koneksi database

exports.getAllKegiatan = (req, res) => {
  const { search = "", skp_id = null, page = 1, limit = 10 } = req.query;
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const parsedSkpId = skp_id ? parseInt(skp_id) : null;
  const pegawai_id = req.user.id; // Dari JWT

  if (
    isNaN(parsedPage) ||
    parsedPage < 1 ||
    isNaN(parsedLimit) ||
    parsedLimit < 1 ||
    (parsedSkpId !== null && (isNaN(parsedSkpId) || parsedSkpId < 1))
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid page, limit, or skp_id" });
  }

  Kegiatan.findAll(
    pegawai_id,
    parsedSkpId,
    search,
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
          kegiatan: results,
          pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.ceil(total / parsedLimit),
          },
        },
        message: "Kegiatan retrieved successfully",
      });
    }
  );
};

exports.createKegiatan = (req, res) => {
  const pegawai_id = req.user.id; // Dari JWT
  const kegiatanData = {
    skp_id: req.body.skp_id,
    pegawai_id,
    rekam_medis: req.body.rekam_medis,
    tgl_kegiatan: req.body.tgl_kegiatan,
  };

  // Cek duplikasi kombinasi skp_id, pegawai_id, rekam_medis, dan tgl_kegiatan
  Kegiatan.checkDuplicate(
    kegiatanData.skp_id,
    kegiatanData.pegawai_id,
    kegiatanData.rekam_medis,
    kegiatanData.tgl_kegiatan,
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
            "Kegiatan with same skp_id, rekam_medis, and tgl_kegiatan already exists for this pegawai",
        });
      }

      Kegiatan.create(kegiatanData, (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to create kegiatan",
            error: err.message,
          });
        }
        res.status(201).json({
          success: true,
          data: { id: result.insertId },
          message: "Kegiatan created successfully",
        });
      });
    }
  );
};

exports.updateKegiatan = (req, res) => {
  const { id } = req.params;
  const pegawai_id = req.user.id; // Dari JWT
  const tgl_kegiatan = req.body.tgl_kegiatan;

  // Ambil data kegiatan untuk cek duplikasi
  pool.query(
    "SELECT skp_id, rekam_medis FROM kegiatan WHERE id = ? AND pegawai_id = ?",
    [id, pegawai_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Kegiatan not found or not authorized",
        });
      }

      const { skp_id, rekam_medis } = results[0];

      // Cek duplikasi untuk tgl_kegiatan baru
      Kegiatan.checkDuplicate(
        skp_id,
        pegawai_id,
        rekam_medis,
        tgl_kegiatan,
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
                "Kegiatan with same skp_id, rekam_medis, and tgl_kegiatan already exists for this pegawai",
            });
          }

          Kegiatan.update(id, pegawai_id, tgl_kegiatan, (err, result) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Failed to update kegiatan",
                error: err.message,
              });
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({
                success: false,
                message: "Kegiatan not found or not authorized",
              });
            }
            res.json({
              success: true,
              data: { id },
              message: "Kegiatan updated successfully",
            });
          });
        }
      );
    }
  );
};

exports.getKegiatanCountBySkp = (req, res) => {
  const pegawai_id = req.user.id; // Dari JWT

  Kegiatan.countBySkpForCurrentMonth(pegawai_id, (err, results) => {
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
      message: "Kegiatan count by SKP retrieved successfully",
    });
  });
};

exports.deleteKegiatan = (req, res) => {
  const { id } = req.params;
  const pegawai_id = req.user.id; // Dari JWT

  Kegiatan.delete(id, pegawai_id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete kegiatan",
        error: err.message,
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Kegiatan not found or not authorized",
      });
    }
    res.json({
      success: true,
      data: { id },
      message: "Kegiatan deleted successfully",
    });
  });
};
