'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    google: any
    initGoogleMap: () => void
  }
}

export default function TerritorioPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [totalGeocodificados, setTotalGeocodificados] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data: eleitores } = await supabase
        .from('eleitores')
        .select('nome, bairro, lat, lng')
        .not('lat', 'is', null)

      const pontos = eleitores ?? []
      setTotalGeocodificados(pontos.length)

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=visualization&callback=initGoogleMap`
      script.async = true

      window.initGoogleMap = () => {
        if (!mapRef.current) return
        const center = pontos.length
          ? { lat: pontos[0].lat, lng: pontos[0].lng }
          : { lat: -23.565, lng: -46.652 }

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#152944' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B5' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0A1220' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E3A5F' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0E1A2E' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          ],
        })

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

      document.head.appendChild(script)
    }
    carregar()
  }, [])

  return (
    <main className="p-8">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500 mb-1">Painel / Território</div>
        <h1 className="text-2xl font-bold">Mapa Eleitoral</h1>
        <p className="text-sm text-slate-500 mt-1">
          {totalGeocodificados} eleitor(es) geocodificado(s) plotados em tempo real, direto da Base de Eleitores.
        </p>
      </div>
      <div className="bg-white border border-line">
        <div ref={mapRef} style={{ width: '100%', height: '520px' }} />
      </div>
    </main>
  )
}
