// Envia um arquivo para o Supabase Storage com nome seguro (uuid + extensão, sem acento).
export async function enviarArquivo(supabase: any, bucket: 'anexos' | 'avatars', pasta: string, file: File) {
  const ext = (file.name.split('.').pop() ?? 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin'
  const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(caminho, file, { contentType: file.type || undefined })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(bucket).getPublicUrl(caminho)
  return { url: data.publicUrl as string, nome: file.name }
}

export function validarCNPJ(valor: string): boolean {
  const c = valor.replace(/\D/g, '')
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false
  const calc = (base: string, pesos: number[]) => {
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * pesos[i], 0)
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = calc(c.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calc(c.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return c.endsWith(`${d1}${d2}`)
}

export function formatarCNPJ(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
