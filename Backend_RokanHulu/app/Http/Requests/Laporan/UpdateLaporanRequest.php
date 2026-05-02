<?php

namespace App\Http\Requests\Laporan;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLaporanRequest extends FormRequest
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
            'nama_pelapor' => ['sometimes', 'string', 'max:120'],
            'kecamatan_id' => ['sometimes', 'integer'],
            'lokasi_text' => ['sometimes', 'string'],
            'latitude' => ['sometimes', 'numeric'],
            'longitude' => ['sometimes', 'numeric'],
            'waktu_kejadian' => ['sometimes', 'date'],
            'status' => ['sometimes', 'string'],
            'severity_level' => ['nullable', 'integer', 'between:1,3'],
            'detail' => ['nullable', 'array'],
        ];
    }
}
