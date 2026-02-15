import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NavigationTab } from '@/types/navigation'

interface AppState {
  selectedStock: string | null
  activeTab: NavigationTab
  favorites: string[]

  setSelectedStock: (symbol: string) => void
  setActiveTab: (tab: NavigationTab) => void
  addFavorite: (symbol: string) => void
  removeFavorite: (symbol: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedStock: null,
      activeTab: 'overview',
      favorites: ['AAPL', 'TSLA'],

      setSelectedStock: (symbol) =>
       set({ selectedStock: symbol }),

      setActiveTab: (tab) =>
        set({ activeTab: tab }),

      addFavorite: (symbol) => {
        const current = get().favorites
        if (!current.includes(symbol)) {
          set({ favorites: [...current, symbol] })
        }
      },

      removeFavorite: (symbol) =>
        set({
          favorites: get().favorites.filter(
            (fav) => fav !== symbol
          ),
        }),
    }),
    {
      name: 'chartwise-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        favorites: state.favorites,
      }),
    }
  )
)
