export type Acao = 'ver' | 'criar' | 'editar' | 'excluir'
export const ACOES: Acao[] = ['ver', 'criar', 'editar', 'excluir']
export type Permissoes = Record<string, Partial<Record<Acao, boolean>>>

export type ItemNav = { href: string; label: string; icon: string; modulo?: string; admin?: boolean; sempre?: boolean }

export const NAV: { grupo: string; itens: ItemNav[] }[] = [
  { grupo: 'Geral', itens: [
    { href: '/dashboard', label: 'Visão geral', icon: '◆', sempre: true },
    { href: '/dashboard/gestao/agenda', label: 'Agenda', icon: '◷', modulo: 'agenda' },
    { href: '/dashboard/agenda-externa', label: 'Agenda externa', icon: '➤', modulo: 'agenda' },
  ]},
  { grupo: 'Jurídico', itens: [
    { href: '/dashboard/gabinete/proposicoes', label: 'Proposições', icon: '§', modulo: 'proposicoes' },
    { href: '/dashboard/juridico/modelos', label: 'Modelos de Documentos', icon: '❏', modulo: 'modelos' },
    { href: '/dashboard/legislativo/comissoes', label: 'Comissões & Pareceres', icon: '⚖', modulo: 'comissoes' },
    { href: '/dashboard/gabinete/documentos', label: 'Documentos & Ofícios', icon: '▦', modulo: 'documentos' },
    { href: '/dashboard/emendas', label: 'Emendas Parlamentares', icon: '❖', modulo: 'emendas' },
  ]},
  { grupo: 'Atendimento ao Cidadão', itens: [
    { href: '/dashboard/gabinete/atendimentos', label: 'Atendimento ao cidadão', icon: '☎', modulo: 'atendimentos' },
  ]},
  { grupo: 'Comunicação', itens: [
    { href: '/dashboard/comunicacao', label: 'Disparos WhatsApp e segmentação', icon: '✉', modulo: 'comunicacao' },
    { href: '/dashboard/fidelizacao', label: 'Lembretes de aniversário', icon: '✦', modulo: 'fidelizacao' },
    { href: '/dashboard/imprensa', label: 'Imprensa & Redes Sociais', icon: '◉', modulo: 'imprensa' },
  ]},
  { grupo: 'Eleitores', itens: [
    { href: '/dashboard/territorio', label: 'Mapa eleitoral', icon: '◈', modulo: 'territorio' },
    { href: '/dashboard/eleitores', label: 'Base de eleitores', icon: '▤', modulo: 'eleitores' },
  ]},
  { grupo: 'Operações', itens: [
    { href: '/dashboard/campo', label: 'Equipe de rua', icon: '▲', modulo: 'campo' },
    { href: '/dashboard/logistica', label: 'Logística', icon: '▧', modulo: 'logistica' },
    { href: '/dashboard/gestao/financeiro', label: 'Financeiro', icon: '$', modulo: 'financeiro' },
    { href: '/dashboard/cadastros/fornecedores', label: 'Fornecedores & Prestadores', icon: '▣', modulo: 'fornecedores' },
  ]},
  { grupo: 'Configurações · Cadastros', itens: [
    { href: '/dashboard/cadastros/usuarios', label: 'Usuários & Equipe', icon: '☻', admin: true },
    { href: '/dashboard/cadastros/etiquetas', label: 'Etiquetas & Categorias', icon: '⚑', modulo: 'etiquetas' },
  ]},
  { grupo: 'Configurações · Sistema', itens: [
    { href: '/dashboard/configuracoes/mandato', label: 'Perfil do Mandato', icon: '✪', admin: true },
    { href: '/dashboard/configuracoes/permissoes', label: 'Permissões e Perfis', icon: '⚿', admin: true },
    { href: '/dashboard/configuracoes/logs', label: 'Logs / Auditoria', icon: '☰', admin: true },
    { href: '/dashboard/configuracoes/integracoes', label: 'Integrações', icon: '⇄', admin: true },
  ]},
]

// Módulos da matriz de permissões (somenteVer = só faz sentido "Visualizar")
export const MODULOS_PERMISSAO: { chave: string; rotulo: string; grupo: string; somenteVer?: boolean }[] = [
  { chave: 'agenda', rotulo: 'Agenda e Agenda externa', grupo: 'Geral' },
  { chave: 'proposicoes', rotulo: 'Proposições', grupo: 'Jurídico' },
  { chave: 'modelos', rotulo: 'Modelos de Documentos', grupo: 'Jurídico' },
  { chave: 'comissoes', rotulo: 'Comissões & Pareceres', grupo: 'Jurídico' },
  { chave: 'documentos', rotulo: 'Documentos & Ofícios', grupo: 'Jurídico' },
  { chave: 'emendas', rotulo: 'Emendas Parlamentares', grupo: 'Jurídico' },
  { chave: 'atendimentos', rotulo: 'Atendimento ao cidadão', grupo: 'Atendimento ao Cidadão' },
  { chave: 'comunicacao', rotulo: 'Disparos WhatsApp e segmentação', grupo: 'Comunicação' },
  { chave: 'fidelizacao', rotulo: 'Lembretes de aniversário', grupo: 'Comunicação', somenteVer: true },
  { chave: 'imprensa', rotulo: 'Imprensa & Redes Sociais', grupo: 'Comunicação' },
  { chave: 'territorio', rotulo: 'Mapa eleitoral', grupo: 'Eleitores', somenteVer: true },
  { chave: 'eleitores', rotulo: 'Base de eleitores', grupo: 'Eleitores' },
  { chave: 'campo', rotulo: 'Equipe de rua', grupo: 'Operações' },
  { chave: 'logistica', rotulo: 'Logística', grupo: 'Operações' },
  { chave: 'financeiro', rotulo: 'Financeiro', grupo: 'Operações' },
  { chave: 'fornecedores', rotulo: 'Fornecedores & Prestadores', grupo: 'Operações' },
  { chave: 'etiquetas', rotulo: 'Etiquetas & Categorias', grupo: 'Configurações' },
]

export function podeEm(isAdmin: boolean, permissoes: Permissoes, modulo: string, acao: Acao = 'ver') {
  return isAdmin || !!permissoes?.[modulo]?.[acao]
}
