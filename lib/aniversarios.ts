// Junta as datas de nascimento de eleitores e atendimentos numa lista única.
// Importante: NÃO usa new Date() para ler a data de nascimento — "1990-05-10" virado em Date
// pode cair no dia anterior por causa de fuso horário. Aqui lemos direto da string.

export type Aniversariante = {
  id: string
  nome: string
  telefone: string | null
  dia: number
  mes: number // 1-12
  ano: number
  origem: 'eleitor' | 'atendimento' | 'ambos'
}

export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type LinhaBruta = { id: string; nome: string; telefone: string | null; data_nascimento: string | null }

function converter(linhas: LinhaBruta[], origem: 'eleitor' | 'atendimento'): Aniversariante[] {
  const resultado: Aniversariante[] = []
  for (const l of linhas) {
    if (!l.data_nascimento) continue
    const [ano, mes, dia] = l.data_nascimento.split('-').map(Number)
    if (!ano || !mes || !dia) continue
    resultado.push({ id: `${origem}-${l.id}`, nome: l.nome, telefone: l.telefone, dia, mes, ano, origem })
  }
  return resultado
}

export async function buscarAniversariantes(supabase: any): Promise<Aniversariante[]> {
  const [eleitores, atendimentos] = await Promise.all([
    supabase.from('eleitores').select('id, nome, telefone, data_nascimento').not('data_nascimento', 'is', null),
    supabase.from('atendimentos').select('id, cidadao, telefone, data_nascimento').not('data_nascimento', 'is', null),
  ])

  const dosEleitores = converter((eleitores.data ?? []) as LinhaBruta[], 'eleitor')
  const dosAtendimentos = converter(
    ((atendimentos.data ?? []) as any[]).map((a) => ({ id: a.id, nome: a.cidadao, telefone: a.telefone, data_nascimento: a.data_nascimento })),
    'atendimento'
  )
  // A mesma pessoa pode estar nas duas bases: junta pelo nome + data de nascimento
  const chave = (p: Aniversariante) => `${p.nome.trim().toLowerCase()}|${p.ano}-${p.mes}-${p.dia}`
  const mapa = new Map<string, Aniversariante>()
  for (const p of [...dosEleitores, ...dosAtendimentos]) {
    const existente = mapa.get(chave(p))
    if (!existente) mapa.set(chave(p), p)
    else mapa.set(chave(p), { ...existente, telefone: existente.telefone ?? p.telefone, origem: existente.origem === p.origem ? existente.origem : 'ambos' })
  }
  return Array.from(mapa.values())
}

export function rotuloOrigem(o: Aniversariante['origem']) {
  return o === 'eleitor' ? 'Eleitor' : o === 'atendimento' ? 'Atendimento' : 'Eleitor + Atendimento'
}

export function linkWhatsApp(telefone: string | null, nome: string): string | null {
  if (!telefone) return null
  const numero = telefone.replace(/\D/g, '')
  if (numero.length < 10) return null
  const texto = encodeURIComponent(`Parabéns, ${nome.split(' ')[0]}! 🎉 Desejamos a você um feliz aniversário, com muita saúde e alegria. Um grande abraço do nosso gabinete!`)
  return `https://wa.me/${numero.startsWith('55') ? numero : '55' + numero}?text=${texto}`
}
