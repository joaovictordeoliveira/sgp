'use client'

import { createContext, useContext } from 'react'
import { Acao, Permissoes, podeEm } from '@/lib/modulos'

const Ctx = createContext<{ isAdmin: boolean; permissoes: Permissoes }>({ isAdmin: false, permissoes: {} })

export function PermissoesProvider({ isAdmin, permissoes, children }: { isAdmin: boolean; permissoes: Permissoes; children: React.ReactNode }) {
  return <Ctx.Provider value={{ isAdmin, permissoes }}>{children}</Ctx.Provider>
}

// const pode = usePode();  pode('eleitores', 'criar')
export function usePode() {
  const { isAdmin, permissoes } = useContext(Ctx)
  return (modulo: string, acao: Acao = 'ver') => podeEm(isAdmin, permissoes, modulo, acao)
}
