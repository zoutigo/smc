"use client";

import { create } from "zustand";

type Step = 1 | 2 | 3 | 4 | 5;

type Lane = { length: number; width: number; height: number; quantity: number };
type ExistingImage = { id: string; url: string };

type State = {
  step: Step;
  name: string;
  description: string;
  plantId: string;
  price: number;
  sop: string;
  flowId?: string;
  supplierId?: string;
  plcType?: string;
  exists: "existing" | "project";
  lanes: Lane[];
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
  flowId: "",
  supplierId: "",
  exists: "existing",
  lanes: [],
  images: [],
  existingImages: [],
  removedImageIds: [],
  plcType: "",
};

export const useCreateStorageMeanStore = create<State & Actions>((set) => ({
  ...initialState,
  next: () => set((s) => ({ step: (Math.min(5, s.step + 1) as Step) })),
  prev: () => set((s) => ({ step: (Math.max(1, s.step - 1) as Step) })),
  setStep: (step) => set({ step }),
  updateField: (field, value) => set({ [field]: value } as Partial<State>),
  addLane: (lane) => set((s) => ({ lanes: [...s.lanes, lane] })),
  removeLane: (index) => set((s) => ({ lanes: s.lanes.filter((_, i) => i !== index) })),
  setImages: (files) => set({ images: files }),
  setExistingImages: (list) => set({ existingImages: list }),
  removeExistingImage: (id) =>
    set((s) => ({
      existingImages: s.existingImages.filter((img) => img.id !== id),
      removedImageIds: [...s.removedImageIds, id],
    })),
  reset: () => set({ ...initialState }),
}));
