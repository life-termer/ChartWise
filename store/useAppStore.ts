import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NavigationTab } from '@/types/navigation'

interface AppState {
  selectedStock: string | null
  activeTab: NavigationTab
  favorites: string[]
  marketOverviewMessages: MarketOverviewMessage[]
  stockAnalysisMessages: StockAnalysisMessage[]

  setSelectedStock: (symbol: string) => void
  setActiveTab: (tab: NavigationTab) => void
  addFavorite: (symbol: string) => void
  removeFavorite: (symbol: string) => void
  addMarketOverviewMessage: (message: MarketOverviewMessage) => void
  removeMarketOverviewMessage: (id: string) => void
  addStockAnalysisMessage: (message: StockAnalysisMessage) => void
  removeStockAnalysisMessage: (id: string) => void
}

export interface MarketOverviewMessage {
  id: string
  text: string
  createdAt: number
}

export interface StockAnalysisMessage {
  id: string
  symbol: string
  text: string
  createdAt: number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedStock: null,
      activeTab: 'overview',
      favorites: ['AAPL', 'TSLA'],
      marketOverviewMessages: [],
      stockAnalysisMessages: [],

      setSelectedStock: (symbol) =>
       set({ selectedStock: symbol, activeTab: 'overview' }),

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

      addMarketOverviewMessage: (message) =>
        set({
          marketOverviewMessages: [
            message,
            ...get().marketOverviewMessages,
          ],
        }),

      removeMarketOverviewMessage: (id) =>
        set({
          marketOverviewMessages: get().marketOverviewMessages.filter(
            (msg) => msg.id !== id
          ),
        }),

      addStockAnalysisMessage: (message) =>
        set({
          stockAnalysisMessages: [
            message,
            ...get().stockAnalysisMessages,
          ],
        }),

      removeStockAnalysisMessage: (id) =>
        set({
          stockAnalysisMessages: get().stockAnalysisMessages.filter(
            (msg) => msg.id !== id
          ),
        }),
    }),
    {
      name: 'chartwise-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        favorites: state.favorites,
        marketOverviewMessages: state.marketOverviewMessages,
        stockAnalysisMessages: state.stockAnalysisMessages,
      }),
    }
  )
)
