const pool = require("../config/database");
const pdf = require("html-pdf");
const Karu = require("../models/karuModel");

// Format tanggal ke dalam format Indonesia (e.g., "31 Mei 2025")
const formatTanggalIndonesia = (tanggal) => {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("id-ID", options).format(new Date(tanggal));
};

// Validasi parameter query
const validateQueryParams = ({
  start_date,
  end_date,
  tanggal_ttd,
  skp,
  karu,
}) => {
  if (!start_date || !end_date || !tanggal_ttd || !skp || !karu) {
    return {
      valid: false,
      message:
        "All query parameters (start_date, end_date, tanggal_ttd, skp, karu) are required",
    };
  }
  if (
    isNaN(Date.parse(start_date)) ||
    isNaN(Date.parse(end_date)) ||
    isNaN(Date.parse(tanggal_ttd))
  ) {
    return {
      valid: false,
      message: "Invalid date format for start_date, end_date, or tanggal_ttd",
    };
  }
  if (isNaN(skp) || isNaN(karu)) {
    return { valid: false, message: "skp and karu must be numeric values" };
  }
  return { valid: true };
};

// Ambil data dari database
const fetchData = async (pegawai_id, skp, start_date, end_date, karu) => {
  // Ambil data pegawai
  const [pegawai] = await pool
    .promise()
    .query("SELECT nama_pegawai, nip, jabatan FROM pegawai WHERE id = ?", [
      pegawai_id,
    ]);
  if (pegawai.length === 0) {
    throw new Error("Pegawai not found");
  }

  // Ambil data karu
  const karuData = await new Promise((resolve, reject) => {
    Karu.findById(karu, (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return reject(new Error("Karu not found"));
      resolve(results[0]);
    });
  });

  // Ambil data kegiatan
  const [kegiatan] = await pool.promise().query(
    `
    SELECT DATE_FORMAT(k.tgl_kegiatan, '%Y-%m-%d') AS tgl_kegiatan,
           k.rekam_medis,
           p.nama_pasien,
           p.diagnosa,
           s.kegiatan_skp
    FROM kegiatan k
    JOIN skp s ON k.skp_id = s.id
    JOIN pasien p ON k.rekam_medis = p.rekam_medis
    WHERE k.pegawai_id = ? AND k.skp_id = ? AND k.tgl_kegiatan BETWEEN ? AND ?
    `,
    [pegawai_id, skp, start_date, end_date]
  );
  if (kegiatan.length === 0) {
    throw new Error("No kegiatan found for the specified filters");
  }

  return { pegawai: pegawai[0], karuData, kegiatan };
};

// Fungsi untuk membuat inisial dari nama pasien
const getInitials = (nama) => {
  if (!nama) return "-";
  return nama
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

// Format data untuk template HTML
const prepareTemplateData = (data, tanggal_ttd, baseUrl) => {
  const { pegawai, karuData, kegiatan } = data;
  const tableData = kegiatan.map((row, index) => ({
    no: index + 1,
    tanggal: formatTanggalIndonesia(row.tgl_kegiatan),
    rekam_medis: row.rekam_medis,
    nama_pasien: getInitials(row.nama_pasien), // Mengubah nama pasien menjadi inisial
    diagnosa: row.diagnosa || "-",
  }));

  // Format bulan dan tahun untuk nama file
  const endDate = new Date(data.kegiatan[0].end_date);
  const bulanTahun = endDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Nama file dinamis
  const safeKegiatanSkp = kegiatan[0].kegiatan_skp
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
  const fileName = `Logbook ${safeKegiatanSkp} ${bulanTahun}.pdf`;

  return {
    base_url: baseUrl,
    kegiatan_skp: kegiatan[0].kegiatan_skp.toUpperCase(),
    nama_pegawai: pegawai.nama_pegawai,
    nip: pegawai.nip,
    jabatan: pegawai.jabatan,
    table_data: tableData,
    tanggal_ttd_formatted: formatTanggalIndonesia(tanggal_ttd),
    karu_jabatan: karuData.jabatan,
    karu_ttd: karuData.ttd,
    karu_nama: karuData.nama,
    karu_nip: karuData.nip,
    fileName,
  };
};

// Generate template HTML
const generateHtmlTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan SKP</title>
      <style>
        @page {
          size: A4;
          margin: 1cm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.1;
        }
        .header-img {
          width: 100%;
          margin-bottom: 10px;
        }
        .title {
          text-align: center;
          font-size: 11pt;
          font-weight: bold;
          margin-bottom: 20px;
          text-transform: uppercase;
        }
        .info {
          margin-bottom: 20px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
          line-height: 1.1;
        }
        .info-table td {
          border: none;
          padding: 2px 0;
          text-align: left;
          font-size: 10pt
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid black;
          padding: 2px;
          text-align: center;
          font-size: 9pt;
          line-height: 1.1;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .signature {
          text-align: right;
          margin-top: 20px;
        }
        .signature p {
          margin: 4px 0;
          font-size: 10pt;
          line-height: 1.1;
        }
        .signature img {
          width: 100px;
          height: auto;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <img src="${
        data.base_url
      }/Uploads/assets/kop_surat.jpg" class="header-img" alt="Kop Surat">
      <div class="title">
        LOGBOOK KEGIATAN RADIOGRAFER<br>
        ${data.kegiatan_skp}
      </div>
      <div class="info">
        <table class="info-table">
          <tr>
            <td>Nama Pegawai</td>
            <td>: ${data.nama_pegawai}</td>
          </tr>
          <tr>
            <td>NIP</td>
            <td>: ${data.nip}</td>
          </tr>
          <tr>
            <td>Jabatan</td>
            <td>: ${data.jabatan}</td>
          </tr>
        </table>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>Rekam Medis</th>
            <th>Nama Pasien</th>
            <th>Diagnosa</th>
          </tr>
        </thead>
        <tbody>
          ${data.table_data
            .map(
              (row) => `
              <tr>
                <td>${row.no}</td>
                <td>${row.tanggal}</td>
                <td>${row.rekam_medis}</td>
                <td>${row.nama_pasien}</td>
                <td>${row.diagnosa}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
      <div class="signature">
        <p>Denpasar, ${data.tanggal_ttd_formatted}</p>
        <p>${data.karu_jabatan}</p>
        <img src="${data.base_url}${
    data.karu_ttd
  }" alt="Tanda Tangan" class="signature-img">
        <p>${data.karu_nama}</p>
        <p>NIP. ${data.karu_nip}</p>
      </div>
    </body>
    </html>
  `;
};

// Generate PDF
const generatePdf = (html, fileName, res) => {
  const options = {
    format: "Legal",
    orientation: "portrait",
    border: {
      top: "1cm",
      bottom: "1cm",
      left: "1cm",
      right: "1cm",
    },
    type: "pdf",
  };

  pdf.create(html, options).toBuffer((err, buffer) => {
    if (err) {
      console.error("Error generating PDF:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: err.message,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
  });
};

// Controller utama untuk menghasilkan laporan SKP
exports.generateLaporanSkp = async (req, res) => {
  const { start_date, end_date, tanggal_ttd, skp, karu } = req.query;
  const pegawai_id = req.user.id; // Dari JWT

  try {
    // Validasi parameter
    const validation = validateQueryParams({
      start_date,
      end_date,
      tanggal_ttd,
      skp,
      karu,
    });
    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    // Ambil data dari database
    const data = await fetchData(pegawai_id, skp, start_date, end_date, karu);

    // Tentukan base URL
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    // Siapkan data untuk template
    const templateData = prepareTemplateData(
      { ...data, end_date },
      tanggal_ttd,
      baseUrl
    );

    // Generate HTML
    const html = generateHtmlTemplate(templateData);

    // Generate dan kirim PDF
    generatePdf(html, templateData.fileName, res);
  } catch (error) {
    console.error("Error in generateLaporanSkp:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message.includes("not found")
        ? error.message
        : "Failed to generate report",
      error: error.message,
    });
  }
};
