import { create } from 'zustand'

type ViewType = 'login' | 'dashboard' | 'sales' | 'sales-report' | 'purchases' | 'purchases-report' | 'inventory' | 'transfers' | 'customers' | 'settings'

interface Tab {
  id: string
  type: ViewType
  title: string
  data?: Record<string, unknown>
}

interface AppState {
  currentView: ViewType
  tabs: Tab[]
  activeTabId: string | null
  sidebarOpen: boolean

  setView: (view: ViewType) => void
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  toggleSidebar: () => void
  updateTabData: (id: string, data: Record<string, unknown>) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  tabs: [],
  activeTabId: null,
  sidebarOpen: true,

  setView: (view) => set({ currentView: view }),

  addTab: (tab) =>
    set((state) => {
      // Check if tab already exists
      const existingTab = state.tabs.find((t) => t.type === tab.type && t.id === tab.id)
      if (existingTab) {
        return { activeTabId: existingTab.id, currentView: existingTab.type }
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
        currentView: tab.type
      }
    }),

  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((tab) => tab.id !== id)
      let newActiveTabId = state.activeTabId
      let newView = state.currentView

      if (state.activeTabId === id) {
        const lastTab = newTabs[newTabs.length - 1]
        newActiveTabId = lastTab?.id || null
        newView = lastTab?.type || 'dashboard'
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
        currentView: newView
      }
    }),

  setActiveTab: (id) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id)
      return {
        activeTabId: id,
        currentView: tab?.type || state.currentView
      }
    }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  updateTabData: (id, data) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, data: { ...tab.data, ...data } } : tab
      )
    }))
}))
