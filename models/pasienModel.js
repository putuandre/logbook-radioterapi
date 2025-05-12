const pool = require("../config/database");

const Pasien = {
  findAll: (search, page, limit, callback) => {
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM pasien";
    let queryParams = [];

    if (search) {
      query += " WHERE nama_pasien LIKE ? OR rekam_medis LIKE ?";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    pool.query(query, queryParams, (err, results) => {
      if (err) return callback(err);
      pool.query(
        "SELECT COUNT(*) as total FROM pasien" +
          (search ? " WHERE nama_pasien LIKE ? OR rekam_medis LIKE ?" : ""),
        search ? [`%${search}%`, `%${search}%`] : [],
        (err, countResult) => {
          if (err) return callback(err);
          callback(null, { results, total: countResult[0].total });
        }
      );
    });
  },
  findByRekamMedis: (rekam_medis, callback) => {
    pool.query(
      "SELECT * FROM pasien WHERE rekam_medis = ?",
      [rekam_medis],
      callback
    );
  },
  checkMultipleRekamMedis: (rekam_medis_list, callback) => {
    pool.query(
      "SELECT rekam_medis FROM pasien WHERE rekam_medis IN (?)",
      [rekam_medis_list],
      callback
    );
  },
  create: (data, callback) => {
    const query = `
      INSERT INTO pasien (rekam_medis, nama_pasien, jenis_kelamin, tgl_lahir, diagnosa)
      VALUES (?, ?, ?, ?, ?)
    `;
    pool.query(
      query,
      [
        data.rekam_medis,
        data.nama_pasien,
        data.jenis_kelamin,
        data.tgl_lahir,
        data.diagnosa,
      ],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return callback(new Error("Rekam medis already exists"));
          }
          return callback(err);
        }
        callback(null, result);
      }
    );
  },
  update: (id, data, callback) => {
    const query = `
      UPDATE pasien 
      SET rekam_medis = ?, nama_pasien = ?, jenis_kelamin = ?, tgl_lahir = ?, diagnosa = ?
      WHERE id = ?
    `;
    pool.query(
      query,
      [
        data.rekam_medis,
        data.nama_pasien,
        data.jenis_kelamin,
        data.tgl_lahir,
        data.diagnosa,
        id,
      ],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return callback(new Error("Rekam medis already exists"));
          }
          return callback(err);
        }
        callback(null, result);
      }
    );
  },
  delete: (id, callback) => {
    pool.query("DELETE FROM pasien WHERE id = ?", [id], callback);
  },
};

module.exports = Pasien;
