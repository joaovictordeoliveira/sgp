'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    google: any
    __sgpInitGoogleMap?: () => void
  }
}

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#152944' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A1220' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E3A5F' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0E1A2E' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

export default function TerritorioPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapaConstruido = useRef(false) // evita construir o mapa mais de uma vez
  const [totalGeocodificados, setTotalGeocodificados] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const { data: eleitores, error } = await supabase
        .from('eleitores')
        .select('nome, bairro, lat, lng')
        .not('lat', 'is', null)

      if (cancelado) return
      if (error) {
        setErro('Erro ao buscar eleitores: ' + error.message)
        return
      }

      const pontos = eleitores ?? []
      setTotalGeocodificados(pontos.length)

      function construirMapa() {
        if (mapaConstruido.current) return // já construído — não constrói de novo
        if (!mapRef.current) return
        if (!window.google?.maps) return
        mapaConstruido.current = true

        const center = pontos.length ? { lat: pontos[0].lat, lng: pontos[0].lng } : { lat: -23.565, lng: -46.652 }
        const map = new window.google.maps.Map(mapRef.current, { center, zoom: 12, styles: MAP_STYLES })

        if (pontos.length > 0) {
          new window.google.maps.visualization.HeatmapLayer({
            data: pontos.map((p) => new window.google.maps.LatLng(p.lat, p.lng)),
            radius: 50,
            map,
          })

          pontos.forEach((p) => {
            const marker = new window.google.maps.Marker({
              position: { lat: p.lat, lng: p.lng },
              map,
              title: p.nome,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: '#3E8A5A',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 1.2,
              },
            })
            const info = new window.google.maps.InfoWindow({
              content: `<b>${p.nome}</b><br><span style="font-family:monospace;font-size:11px;">${p.bairro}</span>`,
            })
            marker.addListener('click', () => info.open(map, marker))
          })
        }
      }

      // Caso 1: a API do Google já está carregada (ex: voltou pra essa página) — usa direto
      if (window.google?.maps) {
        construirMapa()
        return
      }

      // Caso 2: o script já está no documento (outra instância desse componente já pediu) —
      // só espera ele terminar de carregar, sem adicionar de novo
      const scriptExistente = document.getElementById('google-maps-script') as HTMLScriptElement | null
      if (scriptExistente) {
        scriptExistente.addEventListener('load', construirMapa)
        return
      }

      // Caso 3: primeira vez — injeta o script uma única vez
      window.__sgpInitGoogleMap = construirMapa
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=visualization&callback=__sgpInitGoogleMap`
      script.async = true
      script.onerror = () => setErro('Não foi possível carregar o Google Maps. Verifique a chave e as APIs ativadas.')
      document.head.appendChild(script)
    }

    carregar()
    return () => { cancelado = true }
  }, [])

  return (
    <main className="p-8">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Território</div>
        <h1 className="text-2xl font-bold">Mapa Eleitoral</h1>
        <p className="text-sm text-slate-500 mt-1">
          {totalGeocodificados} eleitor(es) geocodificado(s) plotados em tempo real, direto da Base de Eleitores.
        </p>
        {erro && <p className="text-sm text-red-700 mt-1">{erro}</p>}
      </div>
      <div className="bg-white border border-line/60 rounded-xl shadow-card overflow-hidden">
        <div ref={mapRef} style={{ width: '100%', height: '520px' }} />
      </div>
    </main>
  )
}
