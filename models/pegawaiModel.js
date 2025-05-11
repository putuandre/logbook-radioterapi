const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const Pegawai = {
  create: (data, callback) => {
    bcrypt.hash(
      data.password,
      parseInt(process.env.BCRYPT_SALT),
      (err, hashedPassword) => {
        if (err) return callback(err);
        const query = `
        INSERT INTO pegawai (nip, nama_pegawai, password, jabatan, unit_kerja, email, no_sip, role, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
        pool.query(
          query,
          [
            data.nip,
            data.nama_pegawai,
            hashedPassword,
            data.jabatan,
            data.unit_kerja,
            data.email,
            data.no_sip,
            data.role,
            data.active,
          ],
          (err, result) => {
            if (err) {
              if (err.code === "ER_DUP_ENTRY") {
                return callback(new Error("NIP or email already exists"));
              }
              return callback(err);
            }
            callback(null, result);
          }
        );
      }
    );
  },
  findByNipOrEmail: (identifier, callback) => {
    const query = `
      SELECT * FROM pegawai 
      WHERE (nip = ? OR email = ?) AND active = 1
    `;
    pool.query(query, [identifier, identifier], callback);
  },
  findAllActive: (callback) => {
    const query = `
      SELECT id, nip, nama_pegawai, jabatan, unit_kerja, email, no_sip, role, active
      FROM pegawai 
      WHERE active = 1
    `;
    pool.query(query, [], callback);
  },
  findById: (id, callback) => {
    const query = `
      SELECT id, nip, nama_pegawai, jabatan, unit_kerja, email, no_sip, role, active
      FROM pegawai 
      WHERE id = ? AND active = 1
    `;
    pool.query(query, [id], callback);
  },
  findByIdWithPassword: (id, callback) => {
    const query = `
      SELECT id, nip, nama_pegawai, jabatan, unit_kerja, email, no_sip, role, active, password
      FROM pegawai 
      WHERE id = ? AND active = 1
    `;
    pool.query(query, [id], callback);
  },
  updatePassword: (id, newPassword, callback) => {
    bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_SALT),
      (err, hashedPassword) => {
        if (err) return callback(err);
        const query = `
          UPDATE pegawai 
          SET password = ?
          WHERE id = ? AND active = 1
        `;
        pool.query(query, [hashedPassword, id], (err, result) => {
          if (err) return callback(err);
          if (result.affectedRows === 0) {
            return callback(new Error("Pegawai not found or inactive"));
          }
          callback(null, result);
        });
      }
    );
  },
  update: (id, data, callback) => {
    const query = `
      UPDATE pegawai 
      SET nip = ?, nama_pegawai = ?, jabatan = ?, unit_kerja = ?, email = ?, no_sip = ?, role = ?, active = ?
      WHERE id = ? AND active = 1
    `;
    pool.query(
      query,
      [
        data.nip,
        data.nama_pegawai,
        data.jabatan,
        data.unit_kerja,
        data.email,
        data.no_sip,
        data.role,
        data.active,
        id,
      ],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return callback(new Error("NIP or email already exists"));
          }
          return callback(err);
        }
        if (result.affectedRows === 0) {
          return callback(new Error("Pegawai not found or inactive"));
        }
        callback(null, result);
      }
    );
  },
};

module.exports = Pegawai;
