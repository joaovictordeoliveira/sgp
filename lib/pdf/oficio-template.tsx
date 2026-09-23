import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, textAlign: 'center' },
  titulo: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  numero: { fontSize: 10, color: '#5B6B82' },
  data: { marginBottom: 20, textAlign: 'right' },
  destinatario: { marginBottom: 20 },
  corpo: { lineHeight: 1.6, marginBottom: 40 },
  assinatura: { marginTop: 60, textAlign: 'center', borderTop: '1px solid #000', paddingTop: 6, width: 220, alignSelf: 'center' },
})

export type OficioPDFProps = {
  tipo: string
  numero: string
  destinatario: string
  assunto: string
  dataFormatada: string
}

export function OficioPDF({ tipo, numero, destinatario, assunto, dataFormatada }: OficioPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{tipo.toUpperCase()}</Text>
          <Text style={styles.numero}>nº {numero}</Text>
        </View>
        <Text style={styles.data}>{dataFormatada}</Text>
        <View style={styles.destinatario}>
          <Text>Ao(À) {destinatario}</Text>
        </View>
        <View style={styles.corpo}>
          <Text>Assunto: {assunto}</Text>
          <Text style={{ marginTop: 16 }}>
            Vimos, por meio deste {tipo.toLowerCase()}, tratar do assunto acima referido, solicitando a
            devida atenção e providências que se fizerem necessárias.
          </Text>
        </View>
        <View style={styles.assinatura}>
          <Text>Assinatura do Parlamentar</Text>
        </View>
      </Page>
    </Document>
  )
}
