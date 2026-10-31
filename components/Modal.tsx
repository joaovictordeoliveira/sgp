'use client'

export default function Modal({ titulo, onClose, children, largura = 'max-w-md' }: { titulo: string; onClose: () => void; children: React.ReactNode; largura?: string }) {
  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`bg-white w-full ${largura} border border-line/60 rounded-2xl shadow-modal p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg">{titulo}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-ink text-lg leading-none" aria-label="Fechar">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
