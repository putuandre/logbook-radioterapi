const pool = require("../config/database");

const Skp = {
  findAll: (pegawai_id, search, page, limit, callback) => {
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM skp WHERE pegawai_id = ?";
    let queryParams = [pegawai_id];

    if (search) {
      query += " AND (kegiatan_skp LIKE ? OR deskripsi LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    pool.query(query, queryParams, (err, results) => {
      if (err) return callback(err);
      pool.query(
        "SELECT COUNT(*) as total FROM skp WHERE pegawai_id = ?" +
          (search ? " AND (kegiatan_skp LIKE ? OR deskripsi LIKE ?)" : ""),
        search ? [pegawai_id, `%${search}%`, `%${search}%`] : [pegawai_id],
        (err, countResult) => {
          if (err) return callback(err);
          callback(null, { results, total: countResult[0].total });
        }
      );
    });
  },
  create: (data, callback) => {
    const query = `
      INSERT INTO skp (pegawai_id, kegiatan_skp, periode_tahun, deskripsi, active)
      VALUES (?, ?, ?, ?, ?)
    `;
    pool.query(
      query,
      [
        data.pegawai_id,
        data.kegiatan_skp,
        data.periode_tahun,
        data.deskripsi || null,
        data.active,
      ],
      callback
    );
  },
  update: (id, pegawai_id, data, callback) => {
    const query = `
      UPDATE skp 
      SET kegiatan_skp = ?, periode_tahun = ?, deskripsi = ?, active = ?
      WHERE id = ? AND pegawai_id = ?
    `;
    pool.query(
      query,
      [
        data.kegiatan_skp,
        data.periode_tahun,
        data.deskripsi || null,
        data.active,
        id,
        pegawai_id,
      ],
      callback
    );
  },
  delete: (id, pegawai_id, callback) => {
    pool.query(
      "DELETE FROM skp WHERE id = ? AND pegawai_id = ?",
      [id, pegawai_id],
      callback
    );
  },
};

module.exports = Skp;
