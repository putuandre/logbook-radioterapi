const pool = require("../config/database");

const Karu = {
  findAll: (active, callback) => {
    let query = "SELECT id, nama, nip, jabatan, ttd, active FROM karu";
    let queryParams = [];

    if (active === 1) {
      query += " WHERE active = ?";
      queryParams.push(1);
    }

    pool.query(query, queryParams, callback);
  },
  create: (data, callback) => {
    const query = `
      INSERT INTO karu (nama, nip, jabatan, ttd, active)
      VALUES (?, ?, ?, ?, ?)
    `;
    pool.query(
      query,
      [data.nama, data.nip, data.jabatan, data.ttd, data.active],
      callback
    );
  },
  update: (id, data, callback) => {
    const query = `
      UPDATE karu 
      SET nama = ?, nip = ?, jabatan = ?, ttd = ?, active = ?
      WHERE id = ?
    `;
    pool.query(
      query,
      [data.nama, data.nip, data.jabatan, data.ttd, data.active, id],
      callback
    );
  },
  findById: (id, callback) => {
    pool.query("SELECT ttd FROM karu WHERE id = ?", [id], callback);
  },
  delete: (id, callback) => {
    pool.query("DELETE FROM karu WHERE id = ?", [id], callback);
  },
};

module.exports = Karu;
