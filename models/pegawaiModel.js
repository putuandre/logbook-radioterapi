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
};

module.exports = Pegawai;
