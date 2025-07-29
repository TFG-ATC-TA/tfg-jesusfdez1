import { create } from 'zustand';

interface Tank {
  _id: string;
  name: string;
  type: string;
  state?: string;
}

interface TankStore {
  selectedTank: Tank | null;
  boardsByTank: Record<string, string[]> | null;
  setSelectedTank: (tank: Tank | null) => void;
  setBoardsByTank: (boards: Record<string, string[]> | null) => void;
  setTankState: (state: string) => void;
}

const useTankStore = create<TankStore>((set) => ({
  selectedTank: null,
  boardsByTank: null,
  setSelectedTank: (tank) => set({ selectedTank: tank }),
  setBoardsByTank: (boards) => set({ boardsByTank: boards }),
  setTankState: (state) =>
    set((prevState) => ({
      selectedTank: prevState.selectedTank ? { ...prevState.selectedTank, state } : null,
    })),
}));

export default useTankStore;