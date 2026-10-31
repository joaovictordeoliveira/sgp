// Funções da ALESP que rodam no navegador (sem as bibliotecas de XML, que são só do servidor)
export function extrairIdAlesp(entrada: string): string | null {
  const m = /(?:propositura\/|[?&]id=)(\d{3,})/.exec(entrada) ?? /^\s*(\d{3,})\s*$/.exec(entrada)
  return m ? m[1] : null
}
export function linkPropositura(id: string) {
  return `https://www.al.sp.gov.br/propositura/${id}`
}
