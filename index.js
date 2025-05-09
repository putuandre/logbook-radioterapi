const express = require("express");
const authRoutes = require("./routes/authRoutes");
const pasienRoutes = require("./routes/pasienRoutes");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/pasien", pasienRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
