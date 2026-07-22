import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GachaPlannerSnapshot } from "../../lib/types/hsr";
import { clampInteger, HARD_PITY } from "./calculations";

interface GachaPlannerActions {
  toggleOwned: (characterId: string) => void;
  toggleWishlist: (characterId: string) => void;
  setCurrentTickets: (value: number) => void;
  setPity: (value: number) => void;
  setGuaranteed: (value: boolean) => void;
  resetPlanner: () => void;
}

type GachaPlannerStore = GachaPlannerSnapshot & GachaPlannerActions;

const initialState: GachaPlannerSnapshot = {
  ownedCharacterIds: [],
  wishlistCharacterIds: [],
  currentTickets: 0,
  pity: 0,
  guaranteed: false,
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((currentId) => currentId !== id) : [...ids, id];
}

export const useGachaPlannerStore = create<GachaPlannerStore>()(
  persist(
    (set) => ({
      ...initialState,
      toggleOwned: (characterId) =>
        set((state) => ({
          ownedCharacterIds: toggleId(state.ownedCharacterIds, characterId),
        })),
      toggleWishlist: (characterId) =>
        set((state) => ({
          wishlistCharacterIds: toggleId(state.wishlistCharacterIds, characterId),
        })),
      setCurrentTickets: (value) =>
        set({ currentTickets: clampInteger(value, 0, Number.MAX_SAFE_INTEGER) }),
      setPity: (value) => set({ pity: clampInteger(value, 0, HARD_PITY) }),
      setGuaranteed: (value) => set({ guaranteed: value }),
      resetPlanner: () => set(initialState),
    }),
    {
      name: "hsr-gacha-planner",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ownedCharacterIds: state.ownedCharacterIds,
        wishlistCharacterIds: state.wishlistCharacterIds,
        currentTickets: state.currentTickets,
        pity: state.pity,
        guaranteed: state.guaranteed,
      }),
    },
  ),
);
