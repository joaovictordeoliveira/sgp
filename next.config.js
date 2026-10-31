/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // bibliotecas só de servidor, carregadas direto do node_modules (sem passar pelo empacotador)
    serverComponentsExternalPackages: ['unzipper', 'sax', 'exceljs', '@react-pdf/renderer'],
  },
}
module.exports = nextConfig
