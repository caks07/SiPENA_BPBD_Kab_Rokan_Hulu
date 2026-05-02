import api from "./client";
import type { Laporan } from "../types";

export const getLaporan = async (params?: Record<string, string | number>) => {
  const { data } = await api.get("/laporan", { params });
  return data.data as Laporan[];
};

export const getLaporanById = async (id: number) => {
  const { data } = await api.get(`/laporan/${id}`);
  return data;
};

export const patchSeverity = async (id: number, severity_level: number) => {
  const { data } = await api.patch(`/laporan/${id}/severity`, { severity_level });
  return data;
};
