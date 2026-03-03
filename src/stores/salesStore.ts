import { create } from 'zustand'

interface SaleItem {
  id: string
  materialId: string
  materialName: string
  quantity: number
  price: number
  notes?: string
  warehouseId?: string
  availableQuantity: number
}

interface SaleInvoice {
  id?: string
  customerId?: string
  customerName?: string
  warehouseId: string
  items: SaleItem[]
  total: number
  discount: number
  status: 'cash' | 'credit' | 'partial'
  paidAmount: number
  odometer?: number
  couponId?: string
  notes?: string
}

interface SalesState {
  currentInvoice: SaleInvoice | null
  invoices: SaleInvoice[]
  addItem: (item: SaleItem) => void
  updateItem: (id: string, data: Partial<SaleItem>) => void
  removeItem: (id: string) => void
  setWarehouse: (warehouseId: string) => void
  setCustomer: (customerId: string, customerName: string) => void
  setDiscount: (discount: number) => void
  setStatus: (status: 'cash' | 'credit' | 'partial') => void
  setPaidAmount: (amount: number) => void
  setOdometer: (odometer: number) => void
  setNotes: (notes: string) => void
  setCoupon: (couponId: string) => void
  clearInvoice: () => void
  loadInvoice: (invoice: SaleInvoice) => void
  calculateTotal: () => number
}

export const useSalesStore = create<SalesState>((set, get) => ({
  currentInvoice: null,
  invoices: [],

  addItem: (item) =>
    set((state) => {
      const currentItems = state.currentInvoice?.items || []
      const newInvoice = {
        ...state.currentInvoice,
        items: [...currentItems, item]
      } as SaleInvoice

      const total = newInvoice.items.reduce((sum, i) => sum + i.quantity * i.price, 0) - (newInvoice.discount || 0)
      return {
        currentInvoice: { ...newInvoice, total }
      }
    }),

  updateItem: (id, data) =>
    set((state) => {
      if (!state.currentInvoice) return state
      const items = state.currentInvoice.items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      )
      const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0) - (state.currentInvoice.discount || 0)
      return {
        currentInvoice: { ...state.currentInvoice, items, total }
      }
    }),

  removeItem: (id) =>
    set((state) => {
      if (!state.currentInvoice) return state
      const items = state.currentInvoice.items.filter((item) => item.id !== id)
      const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0) - (state.currentInvoice.discount || 0)
      return {
        currentInvoice: { ...state.currentInvoice, items, total }
      }
    }),

  setWarehouse: (warehouseId) =>
    set((state) => ({
      currentInvoice: { ...(state.currentInvoice || { items: [], total: 0, discount: 0, status: 'cash', paidAmount: 0 }), warehouseId }
    })),

  setCustomer: (customerId, customerName) =>
    set((state) => ({
      currentInvoice: { ...(state.currentInvoice || { items: [], total: 0, discount: 0, status: 'cash', paidAmount: 0, warehouseId: '' }), customerId, customerName }
    })),

  setDiscount: (discount) =>
    set((state) => {
      if (!state.currentInvoice) return state
      const itemsTotal = state.currentInvoice.items.reduce((sum, i) => sum + i.quantity * i.price, 0)
      return {
        currentInvoice: { ...state.currentInvoice, discount, total: itemsTotal - discount }
      }
    }),

  setStatus: (status) =>
    set((state) => ({
      currentInvoice: state.currentInvoice ? { ...state.currentInvoice, status } : null
    })),

  setPaidAmount: (paidAmount) =>
    set((state) => ({
      currentInvoice: state.currentInvoice ? { ...state.currentInvoice, paidAmount } : null
    })),

  setOdometer: (odometer) =>
    set((state) => ({
      currentInvoice: state.currentInvoice ? { ...state.currentInvoice, odometer } : null
    })),

  setNotes: (notes) =>
    set((state) => ({
      currentInvoice: state.currentInvoice ? { ...state.currentInvoice, notes } : null
    })),

  setCoupon: (couponId) =>
    set((state) => ({
      currentInvoice: state.currentInvoice ? { ...state.currentInvoice, couponId } : null
    })),

  clearInvoice: () =>
    set({
      currentInvoice: {
        items: [],
        total: 0,
        discount: 0,
        status: 'cash',
        paidAmount: 0,
        warehouseId: ''
      }
    }),

  loadInvoice: (invoice) => set({ currentInvoice: invoice }),

  calculateTotal: () => {
    const state = get()
    if (!state.currentInvoice) return 0
    return state.currentInvoice.items.reduce((sum, i) => sum + i.quantity * i.price, 0) - (state.currentInvoice.discount || 0)
  }
}))
