import { create } from "zustand";

interface FormState {
  step: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  jenis_bencana: string;
  setJenisBencana: (jenis: string) => void;

  laporan: any;
  setLaporan: (data: any) => void;

  detail: any;
  setDetail: (data: any) => void;

  korban: any;
  setKorban: (data: any) => void;

  kerusakan: any;
  setKerusakan: (data: any) => void;

  fotos: File[];
  setFotos: (files: File[]) => void;

  resetForm: () => void;
}

export const useFormStore = create<FormState>((set) => ({
  step: 1,
  setStep: (step) => { window.scrollTo(0,0); set({ step }); },
  nextStep: () => { window.scrollTo(0,0); set((state) => ({ step: Math.min(state.step + 1, 4) })); },
  prevStep: () => { window.scrollTo(0,0); set((state) => ({ step: Math.max(state.step - 1, 1) })); },

  jenis_bencana: "",
  setJenisBencana: (jenis) => set({ jenis_bencana: jenis }),

  laporan: {},
  setLaporan: (data) => set((state) => ({ laporan: { ...state.laporan, ...data } })),

  detail: {},
  setDetail: (data) => set((state) => ({ detail: { ...state.detail, ...data } })),

  korban: {},
  setKorban: (data) => set((state) => ({ korban: { ...state.korban, ...data } })),

  kerusakan: {},
  setKerusakan: (data) => set((state) => ({ kerusakan: { ...state.kerusakan, ...data } })),

  fotos: [],
  setFotos: (fotos) => set({ fotos }),

  resetForm: () => set({
    step: 1,
    jenis_bencana: "",
    laporan: {},
    detail: {},
    korban: {},
    kerusakan: {},
    fotos: []
  })
}));
