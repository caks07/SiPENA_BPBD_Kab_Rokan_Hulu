/**
 * formAccess.ts
 * Helper untuk verifikasi password gate form laporan publik.
 * Ini BUKAN auth admin — tidak pakai Sanctum, tidak ada akun TRC.
 */
import api from './client';

/** Kirim password ke backend, return access_token jika benar */
export async function verifyFormAccess(password: string): Promise<string> {
  const { data } = await api.post('/form-access/verify', { password });
  return data.access_token as string;
}
