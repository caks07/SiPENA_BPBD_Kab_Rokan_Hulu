<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LaporanBencana;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function excel(): StreamedResponse
    {
        $filename = 'rekap-bencana-'.now()->format('Ymd-His').'.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ];

        $callback = function (): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Tanggal', 'Jenis Bencana', 'Kecamatan', 'Lokasi', 'Status', 'Severity']);

            LaporanBencana::query()->with('kecamatan')->orderByDesc('waktu_kejadian')->chunk(200, function ($rows) use ($handle) {
                foreach ($rows as $row) {
                    fputcsv($handle, [
                        $row->waktu_kejadian,
                        $row->jenis_bencana,
                        $row->kecamatan?->nama_kecamatan,
                        $row->lokasi_text,
                        $row->status,
                        'Siaga '.$row->severity_level,
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->streamDownload($callback, $filename, $headers);
    }

    public function pdf(int $id)
    {
        $laporan = LaporanBencana::query()
            ->with(['kecamatan', 'korban', 'kerusakan', 'detailBanjir'])
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.laporan', ['laporan' => $laporan]);

        return $pdf->download("laporan-{$laporan->id}.pdf");
    }
}
