import React from 'react'
import { useLocation } from 'wouter'

export default function Usuario() {
  const [, setLocation] = useLocation()
  return (
    <div>
      <button className="btn" onClick={() => setLocation('/home')}>Volver</button>
      <p>Soy un usuario</p>
    </div>
  )
}
