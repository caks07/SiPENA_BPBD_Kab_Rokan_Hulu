<?php

namespace App\Http\Requests\Laporan;

use Illuminate\Foundation\Http\FormRequest;

class StoreLaporanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>|string>
     */
    public function rules(): array
    {
        return [
            'jenis_bencana' => ['required', 'string'],
            'nama_pelapor' => ['required', 'string', 'max:120'],
            'sumber_laporan' => ['required', 'string'],
            'kecamatan_id' => ['required', 'integer'],
            'lokasi_text' => ['required', 'string'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'waktu_kejadian' => ['required', 'date'],
            'status' => ['nullable', 'string'],
            'severity_level' => ['nullable', 'integer', 'between:1,3'],
            'detail' => ['nullable', 'array'],
        ];
    }
}
