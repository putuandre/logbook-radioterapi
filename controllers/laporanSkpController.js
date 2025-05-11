const pool = require("../config/database");
const puppeteer = require("puppeteer");
const Karu = require("../models/karuModel");

exports.generateLaporanSkp = async (req, res) => {
  const { start_date, end_date, tanggal_ttd, skp, karu } = req.query;
  const pegawai_id = req.user.id; // Dari JWT

  // Validasi query parameter
  if (!start_date || !end_date || !tanggal_ttd || !skp || !karu) {
    return res
      .status(400)
      .json({ success: false, message: "All query parameters are required" });
  }
  if (
    isNaN(Date.parse(start_date)) ||
    isNaN(Date.parse(end_date)) ||
    isNaN(Date.parse(tanggal_ttd))
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid date format" });
  }
  if (isNaN(skp) || isNaN(karu)) {
    return res
      .status(400)
      .json({ success: false, message: "Skp and karu must be numbers" });
  }

  try {
    // Ambil data pegawai
    const [pegawai] = await pool
      .promise()
      .query("SELECT nama_pegawai, nip, jabatan FROM pegawai WHERE id = ?", [
        pegawai_id,
      ]);
    if (pegawai.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pegawai not found" });
    }

    // Ambil data karu menggunakan karuModel
    const karuData = await new Promise((resolve, reject) => {
      Karu.findById(karu, (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return reject(new Error("Karu not found"));
        resolve(results[0]);
      });
    });

    // Ambil data kegiatan dengan DATE_FORMAT untuk tgl_kegiatan
    const [kegiatan] = await pool.promise().query(
      `
      SELECT DATE_FORMAT(k.tgl_kegiatan, '%Y-%m-%d') AS tgl_kegiatan, k.rekam_medis, p.nama_pasien, p.diagnosa, s.kegiatan_skp
      FROM kegiatan k
      JOIN skp s ON k.skp_id = s.id
      JOIN pasien p ON k.rekam_medis = p.rekam_medis
      WHERE k.pegawai_id = ? AND k.skp_id = ? AND k.tgl_kegiatan BETWEEN ? AND ?
      `,
      [pegawai_id, skp, start_date, end_date]
    );

    if (kegiatan.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No kegiatan found for the given filters",
      });
    }

    // Format data untuk HTML
    const tableData = kegiatan.map((row, index) => ({
      no: index + 1,
      tanggal: row.tgl_kegiatan,
      rekam_medis: row.rekam_medis,
      nama_pasien: row.nama_pasien,
      diagnosa: row.diagnosa || "-",
    }));

    // Format tanggal_ttd ke format Indonesia
    const date = new Date(tanggal_ttd);
    const options = { day: "numeric", month: "long", year: "numeric" };
    const tanggal_ttd_formatted = date.toLocaleDateString("id-ID", options);

    // Format bulan dan tahun dari end_date untuk nama file
    const endDate = new Date(end_date);
    const bulanTahun = endDate.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    // Buat base URL dinamis
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Data untuk template HTML
    const htmlData = {
      base_url: baseUrl,
      kegiatan_skp: kegiatan[0].kegiatan_skp.toUpperCase(),
      nama_pegawai: pegawai[0].nama_pegawai,
      nip: pegawai[0].nip,
      jabatan: pegawai[0].jabatan,
      table_data: tableData,
      tanggal_ttd_formatted,
      karu_jabatan: karuData.jabatan,
      karu_ttd: karuData.ttd,
      karu_nama: karuData.nama,
      karu_nip: karuData.nip,
    };

    // Load template HTML
    let html = `<!DOCTYPE html>
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
            font-size: 11pt;
            line-height: 1;
        }
        .header-img {
            width: 100%;
            margin-bottom: 10px;
        }
        .title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
        }
        .info {
            margin-bottom: 20px;
            line-height: 0.3;
        }
        .info p {
            display: flex;
            align-items: flex-start;
        }
        .info-label {
            flex: 0 0 120px;
            text-align: left;
        }
        .info-value {
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid black;
            padding: 4px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .signature {
            text-align: right;
            margin-top: 20px;
            line-height: 0.3;
        }
        .signature img {
            height: 65px;
            margin: 0px 0;
        }
    </style>
</head>
<body>
    <img src="${
      htmlData.base_url
    }/Uploads/assets/kop_surat.jpg" class="header-img" alt="Kop Surat">
    <div class="title">
        LOGBOOK KEGIATAN RADIOGRAFER<br>
        ${htmlData.kegiatan_skp}
    </div>
    <div class="info">
        <p><span class="info-label">Nama Pegawai</span><span class="info-value">: ${
          htmlData.nama_pegawai
        }</span></p>
        <p><span class="info-label">NIP</span><span class="info-value">: ${
          htmlData.nip
        }</span></p>
        <p><span class="info-label">Jabatan</span><span class="info-value">: ${
          htmlData.jabatan
        }</span></p>
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
            ${htmlData.table_data
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
        <p>Denpasar, ${htmlData.tanggal_ttd_formatted}</p>
        <p>${htmlData.karu_jabatan}</p>
        <img src="${htmlData.base_url}${htmlData.karu_ttd}" alt="Tanda Tangan">
        <p>${htmlData.karu_nama}</p>
        <p>NIP. ${htmlData.karu_nip}</p>
    </div>
</body>
</html>`;

    // Buat nama file dinamis: Logbook <kegiatan_skp> <bulan> <tahun>.pdf
    const safeKegiatanSkp = htmlData.kegiatan_skp
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim();
    const fileName = `Logbook ${safeKegiatanSkp} ${bulanTahun}.pdf`;

    // Render PDF dengan Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    });
    await browser.close();

    // Kirim PDF sebagai respon dengan nama file dinamis
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message,
    });
  }
};
