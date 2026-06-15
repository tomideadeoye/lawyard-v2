'use client'

import * as React from "react"
import { useCart } from "./CartContext"

export default function ClearCart() {
  const { clearCart } = useCart()

  React.useEffect(() => {
    clearCart()
  }, [])

  return null
}
