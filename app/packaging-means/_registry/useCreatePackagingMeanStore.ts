"use client";

import { create } from "zustand";

type Step = 1 | 2 | 3 | 4 | 5;

type Part = {
  name: string;
  projectId?: string;
  partFamilyId?: string;
  partsPerPackaging?: number;
  verticalPitch?: number;
  horizontalPitch?: number;
  notes?: string;
};

type ExistingImage = { id: string; url: string };

type State = {
  step: Step;
  name: string;
  description: string;
  price: number;
  sop: string;
  width: number;
  length: number;
  height: number;
  numberOfPackagings: number;
  plantId: string;
  flowId?: string;
  supplierId?: string;
  notes?: string;
  accessories: Array<{ accessoryId: string; qty?: number }>;
  parts: Part[];
  images: File[];
  existingImages: ExistingImage[];
  removedImageIds: string[];
};

type Actions = {
  next: () => void;
  prev: () => void;
  setStep: (step: Step) => void;
  updateField: (field: keyof State, value: unknown) => void;
  addPart: (part: Part) => void;
  removePart: (index: number) => void;
  addAccessory: (acc: { accessoryId: string; qty?: number }) => void;
  removeAccessory: (index: number) => void;
  setImages: (files: File[]) => void;
  setExistingImages: (list: ExistingImage[]) => void;
  removeExistingImage: (id: string) => void;
  reset: () => void;
};

const initialState: State = {
  step: 1,
  name: "",
  description: "",
  price: 0,
  sop: "",
  width: 0,
  length: 0,
  height: 0,
  numberOfPackagings: 1,
  plantId: "",
  flowId: "",
  supplierId: "",
  notes: "",
  accessories: [],
  parts: [],
  images: [],
  existingImages: [],
  removedImageIds: [],
};

export const useCreatePackagingMeanStore = create<State & Actions>((set) => ({
  ...initialState,
  next: () => set((s) => ({ step: (Math.min(5, s.step + 1) as Step) })),
  prev: () => set((s) => ({ step: (Math.max(1, s.step - 1) as Step) })),
  setStep: (step) => set({ step }),
  updateField: (field, value) => set({ [field]: value } as Partial<State>),
  addPart: (part) => set((s) => ({ parts: [...s.parts, part] })),
  removePart: (index) => set((s) => ({ parts: s.parts.filter((_, i) => i !== index) })),
  addAccessory: (acc) =>
    set((s) => ({
      accessories: [...s.accessories, acc],
    })),
  removeAccessory: (index) =>
    set((s) => ({
      accessories: s.accessories.filter((_, i) => i !== index),
    })),
  setImages: (files) => set({ images: files }),
  setExistingImages: (list) => set({ existingImages: list }),
  removeExistingImage: (id) =>
    set((s) => ({
      existingImages: s.existingImages.filter((img) => img.id !== id),
      removedImageIds: [...s.removedImageIds, id],
    })),
  reset: () => set({ ...initialState }),
}));
