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
    return res
      .status(400)
      .json({
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
    return res
      .status(400)
      .json({
        success: false,
        message: "Identifier (NIP or Email) and password are required",
      });
  }
  next();
};
