# UI to API Mapping (SiPENA)

## `halaman_login.html`
- UI: login username/password
- API: `POST /api/auth/login`
- follow-up: `GET /api/auth/me`

## `halaman_dashboard_peta.html`
- UI: dashboard peta + filter kecamatan/jenis/status
- API: `GET /api/laporan`
- API layer kecamatan: `GET /api/geo/kecamatan`

## `halaman_rekap_kabupaten.html`
- UI: filter + table + inline severity + export
- API list: `GET /api/laporan`
- API patch severity: `PATCH /api/laporan/{id}/severity`
- API excel: `GET /api/report/excel`
- API pdf row: `GET /api/report/pdf/{id}`

## `halaman_edit_bencana.html`
- UI: prefill laporan + update
- API detail: `GET /api/laporan/{id}`
- API update: `PUT /api/laporan/{id}`
- API options: `GET /api/options/{opt_table}`

## `halaman_infografis_bencana.html`
- UI: agregasi tanpa tabel
- API source data: `GET /api/laporan`

## `Halaman Form/halaman_pertama.html` + detail per bencana
- UI: input laporan TRC, dynamic field by jenis bencana
- API store: `POST /api/laporan`
- API options: `GET /api/options/{opt_table}`
