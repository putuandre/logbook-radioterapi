const pool = require("../config/database");
const puppeteer = require("puppeteer");
const Karu = require("../models/karuModel");
const KaInstalasi = require("../models/kaInstalasiModel");

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

  // Validasi query parameter
  if (
    !start_date ||
    !end_date ||
    !tanggal_ttd ||
    !tingkat_kegiatan ||
    !karu ||
    !ka_instalasi
  ) {
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
  if (isNaN(karu) || isNaN(ka_instalasi)) {
    return res.status(400).json({
      success: false,
      message: "Karu and ka_instalasi must be numbers",
    });
  }

  try {
    // Ambil data pegawai
    const [pegawai] = await pool
      .promise()
      .query(
        "SELECT nama_pegawai, jabatan, no_sip, unit_kerja FROM pegawai WHERE id = ?",
        [pegawai_id]
      );
    if (pegawai.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pegawai not found" });
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
      return res.status(404).json({
        success: false,
        message: "No kegiatan found for the given filters",
      });
    }

    // Format data tabel
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
            `${
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
            }`
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

    // Hitung periode kunjungan (jumlah bulan)
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const periode_kunjungan =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      endDate.getMonth() -
      startDate.getMonth() +
      1;

    // Format tanggal
    const options = { month: "long", year: "numeric" };
    const periode_start = startDate.toLocaleDateString("id-ID", options);
    const periode_end = endDate.toLocaleDateString("id-ID", options);
    const start_date_formatted = startDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const end_date_formatted = endDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const tanggal_ttd_formatted = new Date(tanggal_ttd).toLocaleDateString(
      "id-ID",
      { day: "numeric", month: "long", year: "numeric" }
    );

    // Buat base URL dinamis
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Data untuk template HTML
    const htmlData = {
      base_url: baseUrl,
      tingkat_kegiatan,
      periode_start,
      periode_end,
      nama_pegawai: pegawai[0].nama_pegawai,
      jabatan: pegawai[0].jabatan,
      no_sip: pegawai[0].no_sip || "-",
      unit_kerja: pegawai[0].unit_kerja || "-",
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
      pegawai_jabatan: pegawai[0].jabatan,
      pegawai_nama: pegawai[0].nama_pegawai,
      ka_instalasi_jabatan: kaInstalasiData.jabatan,
      ka_instalasi_nama: kaInstalasiData.nama,
      ka_instalasi_sip: kaInstalasiData.sip || "-",
    };

    // Load template HTML
    let html = `<!DOCTYPE html>
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
            font-size: 11pt;
            line-height: 1.1;
        }
        .header-img {
            width: 65%;
            display: block;
            margin: 0 auto;
            margin-bottom: 10px;
        }
        .title {
            text-align: center;
            font-size: 16pt;
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
        }
        th, td {
            border: 1px solid black;
            padding: 4px;
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
            text-align: center !important; /* Memastikan semua kolom total rata tengah */
        }
        .summary {
            margin-bottom: 20px;
        }
        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }
        .signature-table td {
            border: none;
            padding: 5px;
            text-align: center;
            vertical-align: top;
        }
        .signature-table .colspan-2 {
            width: 50%;
        }
        .signature-table .signature-space {
            height: 100px;
        }
    </style>
</head>
<body>
    <img src="${
      htmlData.base_url
    }/Uploads/assets/kop_surat.jpg" class="header-img" alt="Kop Surat">
    <div class="title">
        LOGBOOK INDIVIDU<br>
        RANAH PELAYANAN TINGKAT ${htmlData.tingkat_kegiatan}<br>
        PERIODE LOGBOOK ${htmlData.periode_start} S/D ${htmlData.periode_end}
    </div>
    <div class="info">
        <p><span class="info-label">Nama</span><span class="info-value">: ${
          htmlData.nama_pegawai
        }</span></p>
        <p><span class="info-label">Jabatan</span><span class="info-value">: ${
          htmlData.jabatan
        }</span></p>
        <p><span class="info-label">Nomor SIP</span><span class="info-value">: ${
          htmlData.no_sip
        }</span></p>
        <p><span class="info-label">Nama Institusi Tempat Kerja</span><span class="info-value">: ${
          htmlData.unit_kerja
        }</span></p>
        <p><span class="info-label">Jenis Tindakan</span><span class="info-value">: Tingkat ${
          htmlData.tingkat_kegiatan
        }</span></p>
        <p><span class="info-label">Periode Kunjungan Pasien</span><span class="info-value">: ${
          htmlData.periode_kunjungan
        } Bulan</span></p>
        <p><span class="info-label">Jumlah Kunjungan</span><span class="info-value">: ${
          htmlData.jumlah_kunjungan
        }</span></p>
        <p><span class="info-label">Tanggal Mulai Kegiatan</span><span class="info-value">: ${
          htmlData.start_date
        }</span></p>
        <p><span class="info-label">Tanggal Akhir Kegiatan</span><span class="info-value">: ${
          htmlData.end_date
        }</span></p>
    </div>
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
            ${htmlData.table_data
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
                <td>${htmlData.total_januari}</td>
                <td>${htmlData.total_februari}</td>
                <td>${htmlData.total_maret}</td>
                <td>${htmlData.total_april}</td>
                <td>${htmlData.total_mei}</td>
                <td>${htmlData.total_juni}</td>
                <td>${htmlData.total_juli}</td>
                <td>${htmlData.total_agustus}</td>
                <td>${htmlData.total_september}</td>
                <td>${htmlData.total_oktober}</td>
                <td>${htmlData.total_november}</td>
                <td>${htmlData.total_desember}</td>
            </tr>
        </tbody>
    </table>
    <div class="summary">
        <p>Total tindakan yang dilakukan oleh ${
          htmlData.nama_pegawai
        } dari bulan ${htmlData.periode_start} sampai dengan ${
      htmlData.periode_end
    } adalah ${htmlData.jumlah_kunjungan}.</p>
        <p style="text-align: justify;">Demikian Rekap Kegiatan Profesional/Logbook ini kami buat dengan sebenar-benarnya, apabila dari Penelusuran Kemenkes melalui Tim Verifikator terbukti ditemukan <b>ketidaksesuaian data laporan pelayanan keprofesian</b> yang disengaja, maka kami <b>Bersedia capaian SKP selama periode aktif 5 tahun terakhir yang sudah terkumpul dilakukan Penghapusan atau menjadi 0 (nol) SKP</b> (Sesuai Kepmenkes No HK.01.07/MENKES/1561/2024 tentang Pedoman Pengelolaan Pemenuhan Kecukupan SKP Bagi Named & Nakes).</p>
    </div>
    <table class="signature-table">
        <tr>
            <td></td>
            <td>Denpasar, ${htmlData.tanggal_ttd_formatted}</td>
        </tr>
        <tr>
            <td>Mengetahui</td>
            <td></td>
        </tr>
        <tr>
            <td class="colspan-2 signature-space">${htmlData.karu_jabatan}</td>
            <td class="colspan-2 signature-space">${
              htmlData.pegawai_jabatan
            }</td>
        </tr>
        <tr>
            <td class="colspan-2 signature-space">${htmlData.karu_nama}</td>
            <td class="colspan-2 signature-space">${htmlData.pegawai_nama}</td>
        </tr>
        <tr>
            <td colspan="2">Menyetujui</td>
        </tr>
        <tr>
            <td colspan="2" class="signature-space">${
              htmlData.ka_instalasi_jabatan
            }</td>
        </tr>
        <tr>
            <td colspan="2" class="signature-space">${
              htmlData.ka_instalasi_nama
            }</td>
        </tr>
        <tr>
            <td colspan="2">${htmlData.ka_instalasi_sip}</td>
        </tr>
    </table>
</body>
</html>`;

    // Render PDF dengan Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "Legal",
      landscape: true,
      printBackground: true,
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    });
    await browser.close();

    // Kirim PDF sebagai respon
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=laporan_logbook.pdf"
    );
    res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message,
    });
  }
};
