const pool = require("../config/database");

const Kegiatan = {
  findAll: (pegawai_id, skp_id, search, page, limit, callback) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT k.id, k.skp_id, k.pegawai_id, k.rekam_medis, k.tgl_kegiatan, s.kegiatan_skp, p.nama_pasien
      FROM kegiatan k
      JOIN skp s ON k.skp_id = s.id
      JOIN pasien p ON k.rekam_medis = p.rekam_medis
      WHERE k.pegawai_id = ?
    `;
    let queryParams = [pegawai_id];

    if (skp_id) {
      query += " AND k.skp_id = ?";
      queryParams.push(skp_id);
    }

    if (search) {
      query +=
        " AND (s.kegiatan_skp LIKE ? OR p.nama_pasien LIKE ? OR k.rekam_medis LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY k.tgl_kegiatan DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    pool.query(query, queryParams, (err, results) => {
      if (err) return callback(err);
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM kegiatan k
        JOIN skp s ON k.skp_id = s.id
        JOIN pasien p ON k.rekam_medis = p.rekam_medis
        WHERE k.pegawai_id = ?
      `;
      let countParams = [pegawai_id];

      if (skp_id) {
        countQuery += " AND k.skp_id = ?";
        countParams.push(skp_id);
      }

      if (search) {
        countQuery +=
          " AND (s.kegiatan_skp LIKE ? OR p.nama_pasien LIKE ? OR k.rekam_medis LIKE ?)";
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      pool.query(countQuery, countParams, (err, countResult) => {
        if (err) return callback(err);
        callback(null, { results, total: countResult[0].total });
      });
    });
  },
  checkDuplicate: (skp_id, pegawai_id, rekam_medis, tgl_kegiatan, callback) => {
    const query = `
      SELECT id 
      FROM kegiatan 
      WHERE skp_id = ? AND pegawai_id = ? AND rekam_medis = ? AND DATE(tgl_kegiatan) = DATE(?)
    `;
    pool.query(
      query,
      [skp_id, pegawai_id, rekam_medis, tgl_kegiatan],
      callback
    );
  },
  create: (data, callback) => {
    const query = `
      INSERT INTO kegiatan (skp_id, pegawai_id, rekam_medis, tgl_kegiatan)
      VALUES (?, ?, ?, ?)
    `;
    pool.query(
      query,
      [data.skp_id, data.pegawai_id, data.rekam_medis, data.tgl_kegiatan],
      callback
    );
  },
  update: (id, pegawai_id, tgl_kegiatan, callback) => {
    const query = `
      UPDATE kegiatan 
      SET tgl_kegiatan = ?
      WHERE id = ? AND pegawai_id = ?
    `;
    pool.query(query, [tgl_kegiatan, id, pegawai_id], callback);
  },
  countBySkpForCurrentMonth: (pegawai_id, callback) => {
    const query = `
      SELECT s.id AS skp_id, s.kegiatan_skp, COUNT(k.id) AS jumlah
      FROM kegiatan k
      JOIN skp s ON k.skp_id = s.id
      WHERE k.pegawai_id = ?
        AND s.active = 1
        AND YEAR(k.tgl_kegiatan) = YEAR(CURDATE())
        AND MONTH(k.tgl_kegiatan) = MONTH(CURDATE())
      GROUP BY s.id, s.kegiatan_skp
      ORDER BY s.kegiatan_skp ASC
    `;
    pool.query(query, [pegawai_id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },
  delete: (id, pegawai_id, callback) => {
    pool.query(
      "DELETE FROM kegiatan WHERE id = ? AND pegawai_id = ?",
      [id, pegawai_id],
      callback
    );
  },
};

module.exports = Kegiatan;
