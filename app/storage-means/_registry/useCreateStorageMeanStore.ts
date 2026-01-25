"use client";

import { create } from "zustand";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type Lane = { lengthMm: number; widthMm: number; heightMm: number; numberOfLanes: number };
type ExistingImage = { id: string; url: string };
type StaffingLine = { shift: "SHIFT_1" | "SHIFT_2" | "SHIFT_3"; workforceType: "DIRECT" | "INDIRECT"; qty: number; role: string; description?: string };
type HighBaySpec = { numberOfLevels: number; numberOfBays: number; slotLengthMm: number; slotWidthMm: number; slotHeightMm: number; numberOfSlots: number };

type State = {
  step: Step;
  name: string;
  description: string;
  plantId: string;
  price: number;
  sop: string;
  flowIds: string[];
  supplierId?: string;
  exists: "existing" | "project";
  lanes: Lane[];
  highBaySpec: HighBaySpec;
  staffingLines: StaffingLine[];
  heightMm: number;
  usefulSurfaceM2: number;
  grossSurfaceM2: number;
  images: File[];
  existingImages: ExistingImage[];
  removedImageIds: string[];
};

type Actions = {
  next: () => void;
  prev: () => void;
  setStep: (step: Step) => void;
  updateField: (field: keyof State, value: unknown) => void;
  addLane: (lane: Lane) => void;
  removeLane: (index: number) => void;
  setLanes: (lanes: Lane[]) => void;
  setHighBaySpec: (spec: Partial<HighBaySpec>) => void;
  setStaffingLines: (lines: StaffingLine[]) => void;
  setImages: (files: File[]) => void;
  setExistingImages: (list: ExistingImage[]) => void;
  removeExistingImage: (id: string) => void;
  reset: () => void;
};

const initialState: State = {
  step: 1,
  name: "",
  description: "",
  plantId: "",
  price: 0,
  sop: "",
  flowIds: [],
  supplierId: "",
  exists: "existing",
  lanes: [],
  highBaySpec: { numberOfLevels: 0, numberOfBays: 0, slotLengthMm: 0, slotWidthMm: 0, slotHeightMm: 0, numberOfSlots: 0 },
  staffingLines: [],
  heightMm: 0,
  usefulSurfaceM2: 0,
  grossSurfaceM2: 0,
  images: [],
  existingImages: [],
  removedImageIds: [],
};

export const useCreateStorageMeanStore = create<State & Actions>((set) => ({
  ...initialState,
  next: () => set((s) => ({ step: (Math.min(6, s.step + 1) as Step) })),
  prev: () => set((s) => ({ step: (Math.max(1, s.step - 1) as Step) })),
  setStep: (step) => set({ step }),
  updateField: (field, value) => set({ [field]: value } as Partial<State>),
  addLane: (lane) => set((s) => ({ lanes: [...s.lanes, lane] })),
  removeLane: (index) => set((s) => ({ lanes: s.lanes.filter((_, i) => i !== index) })),
  setLanes: (lanes) => set({ lanes }),
  setHighBaySpec: (spec) => set((s) => ({ highBaySpec: { ...s.highBaySpec, ...spec } })),
  setStaffingLines: (lines) => set({ staffingLines: lines }),
  setImages: (files) => set({ images: files }),
  setExistingImages: (list) => set({ existingImages: list }),
  removeExistingImage: (id) =>
    set((s) => ({
      existingImages: s.existingImages.filter((img) => img.id !== id),
      removedImageIds: [...s.removedImageIds, id],
    })),
  reset: () => set({ ...initialState }),
}));
