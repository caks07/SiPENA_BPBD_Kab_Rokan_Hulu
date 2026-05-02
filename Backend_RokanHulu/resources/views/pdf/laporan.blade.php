<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Bencana</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        h2 { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #ddd; padding: 6px; }
        th { background: #f2f2f2; text-align: left; }
    </style>
</head>
<body>
<h2>Laporan Bencana #{{ $laporan->id }}</h2>
<table>
    <tr><th>Jenis</th><td>{{ $laporan->jenis_bencana }}</td></tr>
    <tr><th>Pelapor</th><td>{{ $laporan->nama_pelapor }}</td></tr>
    <tr><th>Kecamatan</th><td>{{ $laporan->kecamatan?->nama_kecamatan }}</td></tr>
    <tr><th>Lokasi</th><td>{{ $laporan->lokasi_text }}</td></tr>
    <tr><th>Status</th><td>{{ $laporan->status }}</td></tr>
    <tr><th>Severity</th><td>Siaga {{ $laporan->severity_level }}</td></tr>
    <tr><th>Waktu Kejadian</th><td>{{ $laporan->waktu_kejadian }}</td></tr>
</table>
</body>
</html>
