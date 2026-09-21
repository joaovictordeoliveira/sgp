'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Parada = { ordem: number; endereco: string; concluida: boolean }
type Rota = { id: string; paradas: Parada[] }

const DB_NAME = 'sgp-campo'
const STORE_NAME = 'fila-checkin'

// ---------- IndexedDB: fila local de check-ins pendentes de sincronizar ----------
function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function enfileirarCheckin(item: { rotaId: string; paradaOrdem: number; lat: number | null; lng: number | null; observacao: string; horario: string }) {
  const db = await abrirDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function listarFila(): Promise<any[]> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function limparItemFila(id: number) {
  const db = await abrirDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export default function CheckinPage() {
  const supabase = createClient()
  const [rota, setRota] = useState<Rota | null>(null)
  const [online, setOnline] = useState(true)
  const [pendentes, setPendentes] = useState(0)

  useEffect(() => {
    setOnline(navigator.onLine)
    window.addEventListener('online', () => { setOnline(true); sincronizar() })
    window.addEventListener('offline', () => setOnline(false))

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    carregarRotaDoDia()
    atualizarContagemPendentes()
  }, [])

  async function carregarRotaDoDia() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const hoje = new Date().toISOString().slice(0, 10)
    const { data } = await supabase.from('rotas').select('*').eq('assessor_id', user.id).eq('data', hoje).limit(1).single()
    if (data) setRota(data as Rota)
  }

  async function atualizarContagemPendentes() {
    try {
      const fila = await listarFila()
      setPendentes(fila.length)
    } catch {
      setPendentes(0)
    }
  }

  async function fazerCheckin(paradaOrdem: number) {
    let lat: number | null = null
    let lng: number | null = null
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 }))
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch {
      // sem permissão de localização — segue sem coordenada
    }

    const item = { rotaId: rota!.id, paradaOrdem, lat, lng, observacao: '', horario: new Date().toISOString() }

    if (navigator.onLine) {
      const enviado = await enviarCheckin(item)
      if (!enviado) {
        await enfileirarCheckin(item)
        await atualizarContagemPendentes()
      }
    } else {
      await enfileirarCheckin(item)
      await atualizarContagemPendentes()
    }

    // marca a parada como concluída visualmente (otimista)
    setRota((prev) => prev && {
      ...prev,
      paradas: prev.paradas.map((p) => (p.ordem === paradaOrdem ? { ...p, concluida: true } : p)),
    })
  }

  async function enviarCheckin(item: { rotaId: string; paradaOrdem: number; lat: number | null; lng: number | null; observacao: string; horario: string }) {
    const { error } = await supabase.from('visitas_checkin').insert({
      rota_id: item.rotaId,
      parada_index: item.paradaOrdem,
      lat: item.lat,
      lng: item.lng,
      observacao: item.observacao,
      horario: item.horario,
      sincronizado: true,
    })
    return !error
  }

  async function sincronizar() {
    const fila = await listarFila()
    for (const item of fila) {
      const ok = await enviarCheckin(item)
      if (ok) await limparItemFila(item.id)
    }
    await atualizarContagemPendentes()
  }

  if (!rota) {
    return (
      <main className="min-h-screen bg-navy-950 text-white flex items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-300">Nenhuma rota atribuída para hoje.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className={`px-4 py-2.5 text-center text-xs font-bold ${online ? 'bg-[#E1EEE4] text-[#2C6B41]' : 'bg-amber text-[#3B2A0B]'}`}>
        {online ? '✓ Conectado' : '⚠ SEM CONEXÃO — dados salvos no aparelho'}
        {pendentes > 0 && ` · ${pendentes} check-in(s) aguardando sincronizar`}
      </div>

      <div className="p-4">
        <h1 className="text-lg font-bold mb-1">Rota de hoje</h1>
        <p className="text-xs text-slate-500 mb-4">{rota.paradas.length} parada(s)</p>

        <div className="space-y-2.5">
          {rota.paradas.sort((a, b) => a.ordem - b.ordem).map((p) => (
            <div key={p.ordem} className={`bg-white border border-line p-3.5 ${p.concluida ? 'opacity-55' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <b className="text-sm">{p.endereco}</b>
                <span className="font-mono text-[10px] bg-paper-dim px-1.5 py-0.5">{p.ordem}</span>
              </div>
              {p.concluida ? (
                <div className="bg-paper-dim text-slate-500 text-xs font-bold text-center py-2">✓ Check-in registrado</div>
              ) : (
                <button onClick={() => fazerCheckin(p.ordem)} className="w-full bg-blue-500 text-white text-xs font-bold py-2">
                  Fazer check-in
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
