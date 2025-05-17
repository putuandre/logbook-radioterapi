const pool = require("../config/database");

const Planning = {
  findAll: (search, activeFilter, page, limit, callback) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        p.id, 
        p.rekam_medis, 
        p.dokter_dpjp_id, 
        p.fiksasi_id, 
        p.fraksi, 
        p.active, 
        pas.nama_pasien, 
        pas.diagnosa, 
        d.nama AS dokter_nama, 
        f.nama AS fiksasi_nama,
        COALESCE((
          SELECT SUM(p2.fraksi)
          FROM planning p2
          WHERE p2.rekam_medis = p.rekam_medis
        ), 0) - COALESCE((
          SELECT COUNT(*)
          FROM jadwal j
          WHERE j.rekam_medis = p.rekam_medis
        ), 0) AS sisa_fraksi
      FROM planning p
      JOIN pasien pas ON p.rekam_medis = pas.rekam_medis
      JOIN dokter_dpjp d ON p.dokter_dpjp_id = d.id
      JOIN fiksasi f ON p.fiksasi_id = f.id
    `;
    let queryParams = [];

    let whereClauses = [];
    if (search) {
      whereClauses.push("(p.rekam_medis LIKE ? OR pas.nama_pasien LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    if (activeFilter !== null) {
      whereClauses.push("p.active = ?");
      queryParams.push(activeFilter);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " ORDER BY p.id DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    pool.query(query, queryParams, (err, results) => {
      if (err) return callback(err);

      let countQuery = `
        SELECT COUNT(*) as total 
        FROM planning p
        JOIN pasien pas ON p.rekam_medis = pas.rekam_medis
      `;
      let countParams = [];

      if (whereClauses.length > 0) {
        countQuery += " WHERE " + whereClauses.join(" AND ");
        countParams = queryParams.slice(0, queryParams.length - 2);
      }

      pool.query(countQuery, countParams, (err, countResult) => {
        if (err) return callback(err);
        callback(null, { results, total: countResult[0].total });
      });
    });
  },

  checkActiveDuplicate: (rekam_medis, excludeId = null, callback) => {
    let query = `
      SELECT id 
      FROM planning 
      WHERE rekam_medis = ? AND active = 1
    `;
    const queryParams = [rekam_medis];

    if (excludeId) {
      query += " AND id != ?";
      queryParams.push(excludeId);
    }

    pool.query(query, queryParams, callback);
  },

  create: (data, callback) => {
    const query = `
      INSERT INTO planning (rekam_medis, dokter_dpjp_id, fiksasi_id, fraksi, active)
      VALUES (?, ?, ?, ?, ?)
    `;
    pool.query(
      query,
      [
        data.rekam_medis,
        data.dokter_dpjp_id,
        data.fiksasi_id,
        data.fraksi,
        data.active,
      ],
      callback
    );
  },

  update: (id, data, callback) => {
    const query = `
      UPDATE planning 
      SET rekam_medis = ?, dokter_dpjp_id = ?, fiksasi_id = ?, fraksi = ?, active = ?
      WHERE id = ?
    `;
    pool.query(
      query,
      [
        data.rekam_medis,
        data.dokter_dpjp_id,
        data.fiksasi_id,
        data.fraksi,
        data.active,
        id,
      ],
      callback
    );
  },

  delete: (id, callback) => {
    pool.query("DELETE FROM planning WHERE id = ?", [id], callback);
  },
};

module.exports = Planning;
