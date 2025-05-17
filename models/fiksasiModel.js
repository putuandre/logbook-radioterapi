const pool = require("../config/database");

const Fiksasi = {
  findAll: (callback) => {
    const query = "SELECT id, nama FROM fiksasi ORDER BY nama ASC";
    pool.query(query, [], callback);
  },

  checkDuplicate: (nama, excludeId = null, callback) => {
    let query = "SELECT id FROM fiksasi WHERE nama = ?";
    const queryParams = [nama];

    if (excludeId) {
      query += " AND id != ?";
      queryParams.push(excludeId);
    }

    pool.query(query, queryParams, callback);
  },

  create: (data, callback) => {
    const query = "INSERT INTO fiksasi (nama) VALUES (?)";
    pool.query(query, [data.nama], callback);
  },

  update: (id, data, callback) => {
    const query = "UPDATE fiksasi SET nama = ? WHERE id = ?";
    pool.query(query, [data.nama, id], callback);
  },

  delete: (id, callback) => {
    pool.query("DELETE FROM fiksasi WHERE id = ?", [id], callback);
  },
};

module.exports = Fiksasi;
