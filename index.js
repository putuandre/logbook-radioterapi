const express = require("express");
const cors = require("cors");
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
const dokterDpjpRoutes = require("./routes/dokterDpjpRoutes");
const fiksasiRoutes = require("./routes/fiksasiRoutes");
const planningRoutes = require("./routes/planningRoutes");
const jadwalRoutes = require("./routes/jadwalRoutes");
require("dotenv").config();

const app = express();

// Konfigurasi CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

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
app.use("/api/dokter-dpjp", dokterDpjpRoutes);
app.use("/api/fiksasi", fiksasiRoutes);
app.use("/api/planning", planningRoutes);
app.use("/api/jadwal", jadwalRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
