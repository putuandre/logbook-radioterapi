const pool = require("../config/database");

const KaInstalasi = {
  findAll: (active, callback) => {
    let query = "SELECT id, nama, nip, jabatan, sip, active FROM ka_instalasi";
    let queryParams = [];

    if (active === 1) {
      query += " WHERE active = ?";
      queryParams.push(1);
    }

    pool.query(query, queryParams, callback);
  },
  create: (data, callback) => {
    const query = `
      INSERT INTO ka_instalasi (nama, nip, jabatan, sip, active)
      VALUES (?, ?, ?, ?, ?)
    `;
    pool.query(
      query,
      [data.nama, data.nip, data.jabatan, data.sip, data.active],
      callback
    );
  },
  update: (id, data, callback) => {
    const query = `
      UPDATE ka_instalasi 
      SET nama = ?, nip = ?, jabatan = ?, sip = ?, active = ?
      WHERE id = ?
    `;
    pool.query(
      query,
      [data.nama, data.nip, data.jabatan, data.sip, data.active, id],
      callback
    );
  },
  delete: (id, callback) => {
    pool.query("DELETE FROM ka_instalasi WHERE id = ?", [id], callback);
  },
};

module.exports = KaInstalasi;
