import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterState } from '@/types';

interface FiltersStore {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearFilters: () => void;
  applyPreset: (preset: Partial<FilterState>) => void;
}

const defaultFilters: FilterState = {
  top: 100,
  fields: 'defaults,source,eventType,division,cardholder,priority,occurrences',
};

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      clearFilters: () => set({ filters: defaultFilters }),
      applyPreset: (preset) =>
        set((state) => ({
          filters: { ...state.filters, ...preset },
        })),
    }),
    {
      name: 'gallagher-filters',
    },
  ),
);
