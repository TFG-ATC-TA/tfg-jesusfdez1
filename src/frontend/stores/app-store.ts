import { create } from 'zustand';

interface Filters {
  dateRange: { from: Date | undefined; to: Date | undefined } | null;
  tankState: string;
  selectedDate: Date | undefined;
}

interface AppDataStore {
  filters: Filters;
  mode: 'realtime' | 'historical';
  serverStatus: { status: string; error: string | null };
  setFilters: (filters: Filters) => void;
  setMode: (mode: 'realtime' | 'historical') => void;
  setServerStatus: (status: { status: string; error: string | null }) => void;
}

const useAppDataStore = create<AppDataStore>((set) => ({
  filters: {
    dateRange: null,
    tankState: 'all',
    selectedDate: undefined,
  },
  mode: 'realtime',
  serverStatus: { status: 'connecting', error: null },
  setFilters: (filters) => set({ filters }),
  setMode: (mode) => set({ mode }),
  setServerStatus: (status) => set({ serverStatus: status }),
}));

export default useAppDataStore;