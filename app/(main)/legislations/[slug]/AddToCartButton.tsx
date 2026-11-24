'use client'

import * as React from 'react'
import { useCart } from '@/components/CartContext'
import type { Legislation } from '@/lib/legislations'
import Link from 'next/link'

export default function AddToCartButton({ act }: { act: Legislation }) {
  const { addToCart, cart } = useCart()
  const [added, setAdded] = React.useState(false)

  const inCart = cart.find((i) => i.id === act.id)

  const handleAdd = () => {
    addToCart({ id: act.id, title: act.title, price: act.price })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex gap-3 items-center">
      <button
        onClick={handleAdd}
        className="bg-[#111129] hover:bg-[#1e1e4a] text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-md"
      >
        {added ? 'Added ✓' : inCart ? 'Add Another' : 'Add to Cart'}
      </button>
      {inCart && (
        <Link
          href="/checkout"
          className="bg-[#a77c5c] hover:bg-[#906b4e] text-white font-extrabold text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all shadow-md no-underline"
        >
          Checkout ({inCart.quantity})
        </Link>
      )}
    </div>
  )
}
