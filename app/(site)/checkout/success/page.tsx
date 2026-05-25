import type { Metadata } from 'next'
import { SuccessClient } from './SuccessClient'

export const metadata: Metadata = {
  title: 'Order Confirmed',
}

export default function CheckoutSuccessPage() {
  return <SuccessClient />
}
