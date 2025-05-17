const pool = require("../config/database");

const DokterDpjp = {
  findAll: (activeFilter, callback) => {
    let query = "SELECT id, nama, active FROM dokter_dpjp";
    const queryParams = [];

    if (activeFilter) {
      query += " WHERE active = ?";
      queryParams.push(1);
    }

    query += " ORDER BY nama ASC";

    pool.query(query, queryParams, callback);
  },

  checkDuplicate: (nama, excludeId = null, callback) => {
    let query = "SELECT id FROM dokter_dpjp WHERE nama = ?";
    const queryParams = [nama];

    if (excludeId) {
      query += " AND id != ?";
      queryParams.push(excludeId);
    }

    pool.query(query, queryParams, callback);
  },

  create: (data, callback) => {
    const query = "INSERT INTO dokter_dpjp (nama, active) VALUES (?, ?)";
    pool.query(query, [data.nama, data.active], callback);
  },

  update: (id, data, callback) => {
    const query = "UPDATE dokter_dpjp SET nama = ?, active = ? WHERE id = ?";
    pool.query(query, [data.nama, data.active, id], callback);
  },

  delete: (id, callback) => {
    pool.query("DELETE FROM dokter_dpjp WHERE id = ?", [id], callback);
  },
};

module.exports = DokterDpjp;
