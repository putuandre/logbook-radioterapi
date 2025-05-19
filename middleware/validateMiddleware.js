const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.validateRegister = (req, res, next) => {
  const {
    nip,
    nama_pegawai,
    password,
    jabatan,
    unit_kerja,
    email,
    role,
    active,
  } = req.body;
  if (
    !nip ||
    !nama_pegawai ||
    !password ||
    !jabatan ||
    !unit_kerja ||
    !email ||
    !role ||
    active === undefined
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }
  next();
};

exports.validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Identifier (NIP or Email) and password are required",
    });
  }
  next();
};

exports.validateChangePassword = (req, res, next) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }
  if (new_password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters",
    });
  }
  next();
};

exports.validateUpdatePegawai = (req, res, next) => {
  const {
    nip,
    nama_pegawai,
    jabatan,
    unit_kerja,
    email,
    no_sip,
    role,
    active,
  } = req.body;
  if (
    !nip ||
    !nama_pegawai ||
    !jabatan ||
    !unit_kerja ||
    !email ||
    !role ||
    active === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided",
    });
  }
  if (!/^\d{18}$/.test(nip)) {
    return res.status(400).json({
      success: false,
      message: "NIP must be 18 digits",
    });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }
  if (!["admin", "radiografer", "root"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be 'admin' or 'radiografer' or 'root'",
    });
  }
  if (typeof active !== "number" || ![0, 1].includes(active)) {
    return res.status(400).json({
      success: false,
      message: "Active must be 0 or 1",
    });
  }
  next();
};

exports.validatePasien = (req, res, next) => {
  const { rekam_medis, nama_pasien, jenis_kelamin, tgl_lahir } = req.body;
  if (!rekam_medis || !nama_pasien || !jenis_kelamin || !tgl_lahir) {
    return res.status(400).json({
      success: false,
      message:
        "Rekam medis, nama pasien, jenis kelamin, and tgl lahir are required",
    });
  }
  if (!["Laki-laki", "Perempuan"].includes(jenis_kelamin)) {
    return res.status(400).json({
      success: false,
      message: "Jenis kelamin must be Laki-laki or Perempuan",
    });
  }
  if (isNaN(Date.parse(tgl_lahir))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tgl lahir format" });
  }
  next();
};

exports.validateCsvUpload = (req, res, next) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No CSV file uploaded" });
  }
  if (req.file.mimetype !== "text/csv") {
    return res
      .status(400)
      .json({ success: false, message: "File must be a CSV" });
  }
  next();
};

exports.validateSkp = (req, res, next) => {
  const { kegiatan_skp, periode_tahun, active } = req.body;
  if (!kegiatan_skp || !periode_tahun) {
    return res.status(400).json({
      success: false,
      message: "Kegiatan SKP and periode tahun are required",
    });
  }
  if (periode_tahun < 2000 || periode_tahun > 2100) {
    return res.status(400).json({
      success: false,
      message: "Periode tahun must be between 2000 and 2100",
    });
  }
  if (active !== undefined && ![0, 1].includes(active)) {
    return res
      .status(400)
      .json({ success: false, message: "Active must be 0 or 1" });
  }
  next();
};

exports.validateJenisKegiatan = (req, res, next) => {
  const { tingkat_kegiatan, nama_kegiatan, active } = req.body;
  if (!tingkat_kegiatan || !nama_kegiatan) {
    return res.status(400).json({
      success: false,
      message: "Tingkat kegiatan and nama kegiatan are required",
    });
  }
  if (active !== undefined && ![0, 1].includes(active)) {
    return res
      .status(400)
      .json({ success: false, message: "Active must be 0 or 1" });
  }
  next();
};

exports.validateDetailSkp = (req, res, next) => {
  const { skp_id, jenis_kegiatan_id } = req.body;
  if (!skp_id || !jenis_kegiatan_id) {
    return res.status(400).json({
      success: false,
      message: "Skp id and jenis kegiatan id are required",
    });
  }
  if (isNaN(skp_id) || isNaN(jenis_kegiatan_id)) {
    return res.status(400).json({
      success: false,
      message: "Skp id and jenis kegiatan id must be numbers",
    });
  }
  next();
};

exports.validateKegiatan = (req, res, next) => {
  const { skp_id, rekam_medis, tgl_kegiatan } = req.body;
  if (!skp_id || !rekam_medis || !tgl_kegiatan) {
    return res.status(400).json({
      success: false,
      message: "Skp id, rekam medis, and tgl kegiatan are required",
    });
  }
  if (isNaN(skp_id)) {
    return res
      .status(400)
      .json({ success: false, message: "Skp id must be a number" });
  }
  if (isNaN(Date.parse(tgl_kegiatan))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tgl kegiatan format" });
  }
  next();
};

exports.validateEditKegiatan = (req, res, next) => {
  const { tgl_kegiatan } = req.body;
  if (!tgl_kegiatan) {
    return res
      .status(400)
      .json({ success: false, message: "Tgl kegiatan is required" });
  }
  if (isNaN(Date.parse(tgl_kegiatan))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tgl kegiatan format" });
  }
  next();
};

exports.validateKaru = (req, res, next) => {
  const { nama, nip, jabatan, active } = req.body;
  if (!nama || !nip || !jabatan) {
    return res
      .status(400)
      .json({ success: false, message: "Nama, nip, and jabatan are required" });
  }
  if (active !== undefined && ![0, 1].includes(parseInt(active))) {
    return res
      .status(400)
      .json({ success: false, message: "Active must be 0 or 1" });
  }
  if (!req.file && req.method === "POST") {
    return res
      .status(400)
      .json({ success: false, message: "Ttd file is required" });
  }
  if (
    req.file &&
    !["image/jpeg", "image/jpg", "image/png"].includes(req.file.mimetype)
  ) {
    return res.status(400).json({
      success: false,
      message: "Ttd must be an image (jpg, jpeg, png)",
    });
  }
  next();
};

exports.validateKaInstalasi = (req, res, next) => {
  const { nama, nip, jabatan, sip, active } = req.body;
  if (!nama || !nip || !jabatan || !sip) {
    return res.status(400).json({
      success: false,
      message: "Nama, nip, jabatan, and sip are required",
    });
  }
  if (active !== undefined && ![0, 1].includes(parseInt(active))) {
    return res
      .status(400)
      .json({ success: false, message: "Active must be 0 or 1" });
  }
  next();
};

exports.validateDokterDpjp = (req, res, next) => {
  const { nama, active } = req.body;
  if (!nama) {
    return res
      .status(400)
      .json({ success: false, message: "Nama is required" });
  }
  if (active !== undefined && ![0, 1].includes(parseInt(active))) {
    return res
      .status(400)
      .json({ success: false, message: "Active must be 0 or 1" });
  }
  next();
};

exports.validateFiksasi = (req, res, next) => {
  const { nama } = req.body;
  if (!nama) {
    return res
      .status(400)
      .json({ success: false, message: "Nama is required" });
  }
  next();
};

exports.validatePlanning = (req, res, next) => {
  const { rekam_medis, dokter_dpjp_id, fiksasi_id, fraksi, active } = req.body;
  if (!rekam_medis || !dokter_dpjp_id || !fiksasi_id || !fraksi) {
    return res.status(400).json({
      success: false,
      message:
        "Rekam medis, dokter_dpjp_id, fiksasi_id, and fraksi are required",
    });
  }
  if (isNaN(fraksi) || fraksi < 1) {
    return res.status(400).json({
      success: false,
      message: "Fraksi must be a positive number",
    });
  }
  if (active !== undefined && ![0, 1].includes(parseInt(active))) {
    return res
      .status(400)
      .json({ success: false, message: "Active must be 0 or 1" });
  }
  next();
};

exports.validateJadwal = (req, res, next) => {
  const { rekam_medis, jadwal_date, jadwal_time } = req.body;
  if (!rekam_medis || !jadwal_date || !jadwal_time) {
    return res.status(400).json({
      success: false,
      message: "Rekam medis, jadwal_date, and jadwal_time are required",
    });
  }
  if (isNaN(Date.parse(jadwal_date))) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_date format",
    });
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(jadwal_time)) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_time format (use HH:MM or HH:MM:SS)",
    });
  }
  next();
};

exports.validateEditJadwal = (req, res, next) => {
  const { jadwal_date, jadwal_time } = req.body;
  if (!jadwal_date || !jadwal_time) {
    return res.status(400).json({
      success: false,
      message: "Jadwal_date and jadwal_time are required",
    });
  }
  if (isNaN(Date.parse(jadwal_date))) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_date format",
    });
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(jadwal_time)) {
    return res.status(400).json({
      success: false,
      message: "Invalid jadwal_time format (use HH:MM or HH:MM:SS)",
    });
  }
  next();
};

exports.validateCsvUrl = (req, res, next) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({
      success: false,
      message: "URL is required",
    });
  }
  if (!url.startsWith("https://docs.google.com/spreadsheets/")) {
    return res.status(400).json({
      success: false,
      message: "URL must be a Google Spreadsheet link",
    });
  }
  if (!url.includes("export?format=csv")) {
    return res.status(400).json({
      success: false,
      message: "URL must be a Google Spreadsheet CSV export link",
    });
  }
  next();
};
