export interface CartItem {
  id: string        // composite: `${projectId}__${pieceKey}`
  projectId: string // Sanity project _id
  pieceKey: string  // Sanity piece _key within the project
  title: string
  price: number     // numeric, in dollars (parsed from Sanity string)
  imageUrl: string  // pre-built URL
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
  isHydrated: boolean
}

export type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'HYDRATE'; items: CartItem[] }
