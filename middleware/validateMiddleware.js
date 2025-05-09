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
    return res
      .status(400)
      .json({
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
