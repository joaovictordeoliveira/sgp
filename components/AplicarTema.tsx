'use client'

import { useEffect } from 'react'

export function aplicarTema(tema: string) {
  const escuro = tema === 'escuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', escuro)
  try { localStorage.setItem('sgp-tema', tema) } catch {}
}

export default function AplicarTema({ tema }: { tema?: string }) {
  useEffect(() => { if (tema) aplicarTema(tema) }, [tema])
  return null
}
