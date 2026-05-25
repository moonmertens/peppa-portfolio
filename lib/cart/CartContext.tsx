'use client'

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import type { CartItem, CartState, CartAction } from './types'

export interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  isHydrated: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  itemCount: number
  total: number
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Deduplicate by id — no-op if item already exists
      if (state.items.some((item) => item.id === action.item.id)) {
        return state
      }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'REMOVE_ITEM': {
      return { ...state, items: state.items.filter((item) => item.id !== action.id) }
    }
    case 'CLEAR_CART': {
      return { ...state, items: [] }
    }
    case 'OPEN_CART': {
      return { ...state, isOpen: true }
    }
    case 'CLOSE_CART': {
      return { ...state, isOpen: false }
    }
    case 'HYDRATE': {
      return { ...state, items: action.items, isHydrated: true }
    }
    default: {
      return state
    }
  }
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false, isHydrated: false })
  // Guard: prevent writing to localStorage before hydration completes
  const isHydratedRef = useRef(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart')
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter(
            (item: unknown): item is CartItem =>
              item !== null &&
              typeof item === 'object' &&
              typeof (item as CartItem).id === 'string' &&
              typeof (item as CartItem).projectId === 'string' &&
              typeof (item as CartItem).pieceKey === 'string' &&
              typeof (item as CartItem).title === 'string' &&
              typeof (item as CartItem).price === 'number' &&
              typeof (item as CartItem).imageUrl === 'string'
          )
          dispatch({ type: 'HYDRATE', items: validItems })
        } else {
          // Not an array — dispatch empty hydration so isHydrated becomes true
          dispatch({ type: 'HYDRATE', items: [] })
        }
      } else {
        // Nothing stored — dispatch empty hydration so isHydrated becomes true
        dispatch({ type: 'HYDRATE', items: [] })
      }
    } catch {
      // localStorage unavailable or malformed data — start with empty cart
      dispatch({ type: 'HYDRATE', items: [] })
    }
    isHydratedRef.current = true
  }, [])

  // Persist items to localStorage whenever they change
  // Guard prevents overwriting stored cart with empty array before hydration completes
  useEffect(() => {
    if (!isHydratedRef.current) return
    try {
      localStorage.setItem('cart', JSON.stringify(state.items))
    } catch {
      // localStorage unavailable (SSR, private browsing) — silently ignore
    }
  }, [state.items])

  const addItem = (item: CartItem) => dispatch({ type: 'ADD_ITEM', item })
  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ITEM', id })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })
  const openCart = () => dispatch({ type: 'OPEN_CART' })
  const closeCart = () => dispatch({ type: 'CLOSE_CART' })

  const itemCount = state.items.length
  const total = state.items.reduce((sum, item) => sum + item.price, 0)

  const value: CartContextValue = {
    items: state.items,
    isOpen: state.isOpen,
    isHydrated: state.isHydrated,
    addItem,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    itemCount,
    total,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCartContext(): CartContextValue {
  const context = useContext(CartContext)
  if (context === null) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  return context
}
