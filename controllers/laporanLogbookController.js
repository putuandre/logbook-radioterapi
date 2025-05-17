const pool = require("../config/database");
const pdf = require("html-pdf");
const Karu = require("../models/karuModel");
const KaInstalasi = require("../models/kaInstalasiModel");

// Format tanggal ke dalam format Indonesia (e.g., "31 Mei 2025")
const formatTanggalIndonesia = (
  tanggal,
  options = { day: "numeric", month: "long", year: "numeric" }
) => {
  return new Intl.DateTimeFormat("id-ID", options).format(new Date(tanggal));
};

// Validasi parameter query
const validateQueryParams = ({
  start_date,
  end_date,
  tanggal_ttd,
  tingkat_kegiatan,
  karu,
  ka_instalasi,
}) => {
  if (
    !start_date ||
    !end_date ||
    !tanggal_ttd ||
    !tingkat_kegiatan ||
    !karu ||
    !ka_instalasi
  ) {
    return {
      valid: false,
      message:
        "All query parameters (start_date, end_date, tanggal_ttd, tingkat_kegiatan, karu, ka_instalasi) are required",
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
  if (isNaN(karu) || isNaN(ka_instalasi)) {
    return {
      valid: false,
      message: "karu and ka_instalasi must be numeric values",
    };
  }
  return { valid: true };
};

// Ambil data dari database
const fetchData = async (
  pegawai_id,
  tingkat_kegiatan,
  start_date,
  end_date,
  karu,
  ka_instalasi
) => {
  // Ambil data pegawai
  const [pegawai] = await pool
    .promise()
    .query(
      "SELECT nama_pegawai, jabatan, no_sip, unit_kerja FROM pegawai WHERE id = ?",
      [pegawai_id]
    );
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

  // Ambil data ka_instalasi
  const kaInstalasiData = await new Promise((resolve, reject) => {
    KaInstalasi.findById(ka_instalasi, (err, results) => {
      if (err) return reject(err);
      if (results.length === 0)
        return reject(new Error("Ka Instalasi not found"));
      resolve(results[0]);
    });
  });

  // Ambil data kegiatan
  const [kegiatan] = await pool.promise().query(
    `
    SELECT jk.nama_kegiatan, MONTH(k.tgl_kegiatan) AS bulan, COUNT(*) AS jumlah
    FROM kegiatan k
    JOIN skp s ON k.skp_id = s.id
    JOIN detail_skp ds ON ds.skp_id = s.id
    JOIN jenis_kegiatan jk ON ds.jenis_kegiatan_id = jk.id
    WHERE k.pegawai_id = ? AND jk.tingkat_kegiatan = ? AND k.tgl_kegiatan BETWEEN ? AND ?
    GROUP BY jk.nama_kegiatan, MONTH(k.tgl_kegiatan)
    `,
    [pegawai_id, tingkat_kegiatan, start_date, end_date]
  );
  if (kegiatan.length === 0) {
    throw new Error("No kegiatan found for the specified filters");
  }

  return { pegawai: pegawai[0], karuData, kaInstalasiData, kegiatan };
};

// Format data untuk tabel
const prepareTableData = (kegiatan) => {
  const namaKegiatanUnik = [
    ...new Set(kegiatan.map((row) => row.nama_kegiatan)),
  ];
  const tableData = namaKegiatanUnik.map((nama_kegiatan, index) => {
    const row = {
      no: index + 1,
      nama_kegiatan,
      januari: 0,
      februari: 0,
      maret: 0,
      april: 0,
      mei: 0,
      juni: 0,
      juli: 0,
      agustus: 0,
      september: 0,
      oktober: 0,
      november: 0,
      desember: 0,
    };
    kegiatan
      .filter((k) => k.nama_kegiatan === nama_kegiatan)
      .forEach((k) => {
        row[
          [
            "",
            "januari",
            "februari",
            "maret",
            "april",
            "mei",
            "juni",
            "juli",
            "agustus",
            "september",
            "oktober",
            "november",
            "desember",
          ][k.bulan]
        ] = k.jumlah;
      });
    return row;
  });

  // Hitung total per bulan
  const totalRow = {
    total_januari: 0,
    total_februari: 0,
    total_maret: 0,
    total_april: 0,
    total_mei: 0,
    total_juni: 0,
    total_juli: 0,
    total_agustus: 0,
    total_september: 0,
    total_oktober: 0,
    total_november: 0,
    total_desember: 0,
  };
  tableData.forEach((row) => {
    Object.keys(totalRow).forEach((key) => {
      totalRow[key] += row[key.replace("total_", "")] || 0;
    });
  });

  // Hitung jumlah kunjungan total
  const jumlah_kunjungan = Object.values(totalRow).reduce(
    (sum, val) => sum + val,
    0
  );

  return { tableData, totalRow, jumlah_kunjungan };
};

// Format data untuk template HTML
const prepareTemplateData = (
  data,
  start_date,
  end_date,
  tanggal_ttd,
  tingkat_kegiatan,
  baseUrl
) => {
  const { pegawai, karuData, kaInstalasiData, kegiatan } = data;
  const { tableData, totalRow, jumlah_kunjungan } = prepareTableData(kegiatan);

  // Hitung periode kunjungan
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const periode_kunjungan =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth() +
    1;

  // Format tanggal
  const periode_start = formatTanggalIndonesia(startDate, {
    month: "long",
    year: "numeric",
  });
  const periode_end = formatTanggalIndonesia(endDate, {
    month: "long",
    year: "numeric",
  });
  const start_date_formatted = formatTanggalIndonesia(startDate);
  const end_date_formatted = formatTanggalIndonesia(endDate);
  const tanggal_ttd_formatted = formatTanggalIndonesia(tanggal_ttd);

  // Nama file dinamis
  const fileName = `Laporan_Logbook_${periode_start.replace(
    " ",
    "_"
  )}_sd_${periode_end.replace(" ", "_")}.pdf`;

  return {
    base_url: baseUrl,
    tingkat_kegiatan: tingkat_kegiatan, // Ambil langsung dari query parameter
    periode_start,
    periode_end,
    nama_pegawai: pegawai.nama_pegawai,
    jabatan: pegawai.jabatan,
    no_sip: pegawai.no_sip || "-",
    unit_kerja: pegawai.unit_kerja || "-",
    periode_kunjungan,
    jumlah_kunjungan,
    start_date: start_date_formatted,
    end_date: end_date_formatted,
    table_data: tableData,
    total_januari: totalRow.total_januari,
    total_februari: totalRow.total_februari,
    total_maret: totalRow.total_maret,
    total_april: totalRow.total_april,
    total_mei: totalRow.total_mei,
    total_juni: totalRow.total_juni,
    total_juli: totalRow.total_juli,
    total_agustus: totalRow.total_agustus,
    total_september: totalRow.total_september,
    total_oktober: totalRow.total_oktober,
    total_november: totalRow.total_november,
    total_desember: totalRow.total_desember,
    tanggal_ttd_formatted,
    karu_jabatan: karuData.jabatan,
    karu_nama: karuData.nama,
    pegawai_jabatan: pegawai.jabatan,
    pegawai_nama: pegawai.nama_pegawai,
    ka_instalasi_jabatan: kaInstalasiData.jabatan,
    ka_instalasi_nama: kaInstalasiData.nama,
    ka_instalasi_sip: kaInstalasiData.sip || "-",
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
      <title>Laporan Logbook</title>
      <style>
        @page {
          size: Legal landscape;
          margin: 1cm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.1;
        }
        .header-img {
          width: 100%;
          display: block;
          margin: 0 auto;
          margin-bottom: 10px;
        }
        .title {
          text-align: center;
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 20px;
          text-transform: uppercase;
        }
        .info {
          margin-bottom: 20px;
        }
        .info p {
          display: flex;
          align-items: flex-start;
          margin: 4px 0;
        }
        .info-label {
          flex: 0 0 250px;
          text-align: left;
        }
        .info-value {
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          box-sizing: border-box;
          font-size: 11px;
        }
        th, td {
          border: 1px solid black;
          padding: 2px;
          text-align: center;
          box-sizing: border-box;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        th:nth-child(1), td:nth-child(1) { width: 5%; }
        th:nth-child(n+3), td:nth-child(n+3) { width: 6.5%; }
        td:nth-child(2) { text-align: left; }
        .total-row {
          font-weight: bold;
        }
        .total-row td {
          text-align: center !important;
        }
        .summary-signature-container {
          page-break-inside: avoid; /* Mencoba mencegah pemisahan */
          display: block;
          margin-top: 0; /* Hilangkan margin atas agar lebih dekat */
          min-height: 250px; /* Pastikan ada ruang cukup untuk summary dan signature */
        }
        .summary {
          margin-bottom: 10px;
          font-size: 11px;
        }
        .summary p {
          margin: 4px 0;
          line-height: 1.5;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0; /* Hilangkan margin atas */
        }
        .signature-table td {
          border: none;
          width: 50%;
          text-align: center;
          vertical-align: top;
        }
        .signature-table .signature-space {
          padding-bottom: 70px; 
        }
        .identitas-table td {
          border: none;
          text-align: left;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <img src="${
        data.base_url
      }/Uploads/assets/kop_surat_landscape.png" class="header-img" alt="Kop Surat">
      <div class="title">
        LOGBOOK INDIVIDU<br>
        RANAH PELAYANAN TINGKAT ${data.tingkat_kegiatan}<br>
        PERIODE LOGBOOK ${data.periode_start} S/D ${data.periode_end}
      </div>
      <table class="identitas-table">
        <tbody>
            <tr>
                <td style="width:25%">Nama</td>
                <td>: ${data.nama_pegawai}</td>
            </tr>
            <tr>
                <td>Jabatan</td>
                <td>: ${data.jabatan}</td>
            </tr>
            <tr>
                <td>Nomor SIP</td>
                <td>: ${data.no_sip}</td>
            </tr>
            <tr>
                <td>Nama Institusi Tempat Kerja</td>
                <td>: ${data.unit_kerja}</td>
            </tr>
            <tr>
                <td>Jenis Tindakan</td>
                <td>: Tingkat ${data.tingkat_kegiatan}</td>
            </tr>
            <tr>
                <td>Periode Kunjungan Pasien</td>
                <td>: ${data.periode_kunjungan} Bulan</td>
            </tr>
            <tr>
                <td>Jumlah Kunjungan</td>
                <td>: ${data.jumlah_kunjungan}</td>
            </tr>
            <tr>
                <td>Tanggal Mulai Kegiatan</td>
                <td>: ${data.start_date}</td>
            </tr>
            <tr>
                <td>Tanggal Akhir Kegiatan</td>
                <td>: ${data.end_date}</td>
            </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th rowspan="2">No</th>
            <th rowspan="2">Nama Kegiatan</th>    
            <th colspan="12">Bulan</th>
          </tr>
          <tr>
            <th>Januari</th>
            <th>Februari</th>
            <th>Maret</th>
            <th>April</th>
            <th>Mei</th>
            <th>Juni</th>
            <th>Juli</th>
            <th>Agustus</th>
            <th>September</th>
            <th>Oktober</th>
            <th>November</th>
            <th>Desember</th>
          </tr>
        </thead>
        <tbody>
          ${data.table_data
            .map(
              (row) => `
              <tr>
                <td>${row.no}</td>
                <td>${row.nama_kegiatan}</td>
                <td>${row.januari}</td>
                <td>${row.februari}</td>
                <td>${row.maret}</td>
                <td>${row.april}</td>
                <td>${row.mei}</td>
                <td>${row.juni}</td>
                <td>${row.juli}</td>
                <td>${row.agustus}</td>
                <td>${row.september}</td>
                <td>${row.oktober}</td>
                <td>${row.november}</td>
                <td>${row.desember}</td>
              </tr>
            `
            )
            .join("")}
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td>${data.total_januari}</td>
            <td>${data.total_februari}</td>
            <td>${data.total_maret}</td>
            <td>${data.total_april}</td>
            <td>${data.total_mei}</td>
            <td>${data.total_juni}</td>
            <td>${data.total_juli}</td>
            <td>${data.total_agustus}</td>
            <td>${data.total_september}</td>
            <td>${data.total_oktober}</td>
            <td>${data.total_november}</td>
            <td>${data.total_desember}</td>
          </tr>
        </tbody>
      </table>
      <div class="summary-signature-container">
        <div class="summary">
          <p>Total tindakan yang dilakukan oleh ${
            data.nama_pegawai
          } dari bulan ${data.periode_start} sampai dengan ${
    data.periode_end
  } adalah ${data.jumlah_kunjungan}.</p>
          <p style="text-align: justify">Demikian Rekap Kegiatan Profesional/Logbook ini kami buat dengan sebenar-benarnya, apabila dari Penelusuran Kemenkes melalui Tim Verifikator terbukti ditemukan <b>ketidaksesuaian data laporan pelayanan keprofesian</b> yang disengaja, maka kami <b>Bersedia capaian SKP selama periode aktif 5 tahun terakhir yang sudah terkumpul dilakukan Penghapusan atau menjadi 0 (nol) SKP</b> (Sesuai Kepmenkes No HK.01.07/MENKES/1561/2024 tentang Pedoman Pengelolaan Pemenuhan Kecukupan SKP Bagi Named & Nakes).</p>
        </div>
        <table class="signature-table">
          <tr>
            <td></td>
            <td>Denpasar, ${data.tanggal_ttd_formatted}</td>
          </tr>
          <tr>
            <td>Mengetahui</td>
            <td></td>
          </tr>
          <tr>
            <td class="signature-space">${data.karu_jabatan}</td>
            <td class="signature-space">${data.pegawai_jabatan}</td>
          </tr>
          <tr>
            <td><b>${data.karu_nama}</b></td>
            <td><b>${data.pegawai_nama}</b></td>
          </tr>
          <tr>
          <td></td>
          </tr>
          <tr>
            <td colspan="2">Menyetujui</td>
          </tr>
          <tr>
            <td colspan="2" class="signature-space">${
              data.ka_instalasi_jabatan
            }</td>
          </tr>
          <tr>
            <td colspan="2"><b>${data.ka_instalasi_nama}</b></td>
          </tr>
          <tr>
            <td colspan="2">No. SIP ${data.ka_instalasi_sip}</td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
};

// Generate PDF
const generatePdf = (html, fileName, res) => {
  const options = {
    format: "Legal",
    orientation: "landscape",
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

// Controller utama untuk menghasilkan laporan logbook
exports.generateLaporanLogbook = async (req, res) => {
  const {
    start_date,
    end_date,
    tanggal_ttd,
    tingkat_kegiatan,
    karu,
    ka_instalasi,
  } = req.query;
  const pegawai_id = req.user.id; // Dari JWT

  try {
    // Validasi parameter
    const validation = validateQueryParams({
      start_date,
      end_date,
      tanggal_ttd,
      tingkat_kegiatan,
      karu,
      ka_instalasi,
    });
    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    // Ambil data dari database
    const data = await fetchData(
      pegawai_id,
      tingkat_kegiatan,
      start_date,
      end_date,
      karu,
      ka_instalasi
    );

    // Tentukan base URL
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    // Siapkan data untuk template, kirim tingkat_kegiatan dari query
    const templateData = prepareTemplateData(
      data,
      start_date,
      end_date,
      tanggal_ttd,
      tingkat_kegiatan,
      baseUrl
    );

    // Generate HTML
    const html = generateHtmlTemplate(templateData);

    // Generate dan kirim PDF
    generatePdf(html, templateData.fileName, res);
  } catch (error) {
    console.error("Error in generateLaporanLogbook:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message.includes("not found")
        ? error.message
        : "Failed to generate report",
      error: error.message,
    });
  }
};
