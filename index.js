const express = require("express");
const authRoutes = require("./routes/authRoutes");
const pasienRoutes = require("./routes/pasienRoutes");
const skpRoutes = require("./routes/skpRoutes");
const jenisKegiatanRoutes = require("./routes/jenisKegiatanRoutes");
const detailSkpRoutes = require("./routes/detailSkpRoutes");
const kegiatanRoutes = require("./routes/kegiatanRoutes");
const karuRoutes = require("./routes/karuRoutes");
const kaInstalasiRoutes = require("./routes/kaInstalasiRoutes");
const laporanSkpRoutes = require("./routes/laporanSkpRoutes");
const laporanLogbookRoutes = require("./routes/laporanLogbookRoutes");
const pegawaiRoutes = require("./routes/pegawaiRoutes");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/pasien", pasienRoutes);
app.use("/api/skp", skpRoutes);
app.use("/api/jenis-kegiatan", jenisKegiatanRoutes);
app.use("/api/detail-skp", detailSkpRoutes);
app.use("/api/kegiatan", kegiatanRoutes);
app.use("/api/karu", karuRoutes);
app.use("/api/ka-instalasi", kaInstalasiRoutes);
app.use("/api/laporan-skp", laporanSkpRoutes);
app.use("/api/laporan-logbook", laporanLogbookRoutes);
app.use("/api/pegawai", pegawaiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
