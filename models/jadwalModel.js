const pool = require("../config/database");

const Jadwal = {
  findAll: (search, page, limit, callback) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        j.id, 
        j.rekam_medis, 
        j.jadwal_date, 
        j.jadwal_time, 
        p.nama_pasien
      FROM jadwal j
      JOIN pasien p ON j.rekam_medis = p.rekam_medis
    `;
    let queryParams = [];

    if (search) {
      query += " WHERE j.rekam_medis LIKE ? OR p.nama_pasien LIKE ?";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY j.jadwal_date DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    pool.query(query, queryParams, (err, results) => {
      if (err) return callback(err);

      let countQuery = `
        SELECT COUNT(*) as total 
        FROM jadwal j
        JOIN pasien p ON j.rekam_medis = p.rekam_medis
      `;
      let countParams = [];

      if (search) {
        countQuery += " WHERE j.rekam_medis LIKE ? OR p.nama_pasien LIKE ?";
        countParams.push(`%${search}%`, `%${search}%`);
      }

      pool.query(countQuery, countParams, (err, countResult) => {
        if (err) return callback(err);
        callback(null, { results, total: countResult[0].total });
      });
    });
  },

  checkDuplicateDate: (
    rekam_medis,
    jadwal_date,
    excludeId = null,
    callback
  ) => {
    let query = `
      SELECT id 
      FROM jadwal 
      WHERE rekam_medis = ? AND jadwal_date = ?
    `;
    const queryParams = [rekam_medis, jadwal_date];

    if (excludeId) {
      query += " AND id != ?";
      queryParams.push(excludeId);
    }

    pool.query(query, queryParams, callback);
  },

  checkPlanningActive: (rekam_medis, callback) => {
    const query = `
      SELECT id 
      FROM planning 
      WHERE rekam_medis = ? AND active = 1
    `;
    pool.query(query, [rekam_medis], callback);
  },

  checkFraksiLimit: (rekam_medis, callback) => {
    const query = `
      SELECT 
        COALESCE((
          SELECT SUM(fraksi) 
          FROM planning 
          WHERE rekam_medis = ?
        ), 0) AS total_fraksi,
        COALESCE((
          SELECT COUNT(*) 
          FROM jadwal 
          WHERE rekam_medis = ?
        ), 0) AS jadwal_count
    `;
    pool.query(query, [rekam_medis, rekam_medis], callback);
  },

  create: (data, callback) => {
    const query = `
      INSERT INTO jadwal (rekam_medis, jadwal_date, jadwal_time)
      VALUES (?, ?, ?)
    `;
    pool.query(
      query,
      [data.rekam_medis, data.jadwal_date, data.jadwal_time],
      callback
    );
  },

  update: (id, data, callback) => {
    const query = `
      UPDATE jadwal 
      SET jadwal_date = ?, jadwal_time = ?
      WHERE id = ?
    `;
    pool.query(query, [data.jadwal_date, data.jadwal_time, id], callback);
  },

  delete: (id, callback) => {
    pool.query("DELETE FROM jadwal WHERE id = ?", [id], callback);
  },

  getById: (id, callback) => {
    const query = "SELECT rekam_medis FROM jadwal WHERE id = ?";
    pool.query(query, [id], callback);
  },
};

module.exports = Jadwal;
