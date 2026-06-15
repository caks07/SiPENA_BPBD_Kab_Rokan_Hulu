<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * ManualBookController
 *
 * Upload, list, download, dan delete file PDF manual book.
 * Semua endpoint memerlukan auth:sanctum + role admin.
 * File disimpan di storage/app/public/manual_books/
 */
class ManualBookController extends Controller
{
    /**
     * GET /api/admin/manual-books
     */
    public function index()
    {
        $books = DB::table('manual_books as mb')
            ->leftJoin('users as u', 'mb.uploaded_by', '=', 'u.id')
            ->select('mb.*', 'u.name as uploaded_by_name')
            ->orderBy('mb.created_at', 'desc')
            ->get();

        return response()->json($books);
    }

    /**
     * POST /api/admin/manual-books
     * Upload PDF baru.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'file'  => 'required|file|mimes:pdf|max:10240', // 10MB
        ], [
            'file.mimes' => 'File harus berformat PDF.',
            'file.max'   => 'Ukuran file maksimal 10 MB.',
        ]);

        $file     = $request->file('file');
        $path     = $file->store('manual_books', 'public');
        $fileName = $file->getClientOriginalName();
        $fileSize = $file->getSize();

        $id = DB::table('manual_books')->insertGetId([
            'title'       => $request->title,
            'file_path'   => '/storage/' . $path,
            'file_name'   => $fileName,
            'file_size'   => $fileSize,
            'uploaded_by' => $request->user()->id,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json([
            'message' => 'Manual book berhasil diunggah.',
            'id'      => $id,
        ], 201);
    }

    /**
     * GET /api/admin/manual-books/{id}/download
     * Download file PDF (memerlukan auth).
     */
    public function download($id)
    {
        $book = DB::table('manual_books')->where('id', $id)->first();
        if (!$book) {
            return response()->json(['error' => 'File tidak ditemukan.'], 404);
        }

        // Strip leading /storage/ dari file_path untuk Storage::disk
        $storagePath = str_replace('/storage/', '', $book->file_path);

        if (!Storage::disk('public')->exists($storagePath)) {
            return response()->json(['error' => 'File tidak tersedia di server.'], 404);
        }

        return Storage::disk('public')->download($storagePath, $book->file_name);
    }

    /**
     * DELETE /api/admin/manual-books/{id}
     */
    public function destroy($id)
    {
        $book = DB::table('manual_books')->where('id', $id)->first();
        if (!$book) {
            return response()->json(['error' => 'File tidak ditemukan.'], 404);
        }

        // Hapus file dari storage
        $storagePath = str_replace('/storage/', '', $book->file_path);
        Storage::disk('public')->delete($storagePath);

        DB::table('manual_books')->where('id', $id)->delete();

        return response()->json(['message' => 'Manual book berhasil dihapus.']);
    }
}
