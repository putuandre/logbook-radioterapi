const pool = require("../config/database");

const JenisKegiatan = {
  findAll: (search, tingkat_kegiatan, page, limit, callback) => {
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM jenis_kegiatan";
    let queryParams = [];
    let conditions = [];

    if (tingkat_kegiatan) {
      conditions.push("tingkat_kegiatan = ?");
      queryParams.push(tingkat_kegiatan);
    }

    if (search) {
      conditions.push("(nama_kegiatan LIKE ? OR tingkat_kegiatan LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    pool.query(query, queryParams, (err, results) => {
      if (err) return callback(err);
      pool.query(
        "SELECT COUNT(*) as total FROM jenis_kegiatan" +
          (conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : ""),
        queryParams.slice(0, queryParams.length - 2), // Exclude LIMIT and OFFSET
        (err, countResult) => {
          if (err) return callback(err);
          callback(null, { results, total: countResult[0].total });
        }
      );
    });
  },
  create: (data, callback) => {
    const query = `
      INSERT INTO jenis_kegiatan (tingkat_kegiatan, nama_kegiatan, active)
      VALUES (?, ?, ?)
    `;
    pool.query(
      query,
      [data.tingkat_kegiatan, data.nama_kegiatan, data.active],
      callback
    );
  },
  update: (id, data, callback) => {
    const query = `
      UPDATE jenis_kegiatan 
      SET tingkat_kegiatan = ?, nama_kegiatan = ?, active = ?
      WHERE id = ?
    `;
    pool.query(
      query,
      [data.tingkat_kegiatan, data.nama_kegiatan, data.active, id],
      callback
    );
  },
  delete: (id, callback) => {
    pool.query("DELETE FROM jenis_kegiatan WHERE id = ?", [id], callback);
  },
};

module.exports = JenisKegiatan;
