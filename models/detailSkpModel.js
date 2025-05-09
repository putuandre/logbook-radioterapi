const pool = require("../config/database");

const DetailSkp = {
  findBySkpId: (skp_id, pegawai_id, callback) => {
    const query = `
      SELECT ds.id, ds.skp_id, ds.jenis_kegiatan_id, ds.pegawai_id,jk.tingkat_kegiatan, jk.nama_kegiatan
      FROM detail_skp ds
      JOIN jenis_kegiatan jk ON ds.jenis_kegiatan_id = jk.id
      WHERE ds.skp_id = ? AND ds.pegawai_id = ?
    `;
    pool.query(query, [skp_id, pegawai_id], callback);
  },
  create: (data, callback) => {
    const query = `
      INSERT INTO detail_skp (skp_id, jenis_kegiatan_id, pegawai_id)
      VALUES (?, ?, ?)
    `;
    pool.query(
      query,
      [data.skp_id, data.jenis_kegiatan_id, data.pegawai_id],
      callback
    );
  },
  delete: (id, pegawai_id, callback) => {
    pool.query(
      "DELETE FROM detail_skp WHERE id = ? AND pegawai_id = ?",
      [id, pegawai_id],
      callback
    );
  },
};

module.exports = DetailSkp;
