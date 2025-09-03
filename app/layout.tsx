import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clínicas Cerca',
  description: 'Encuentra clínicas médicas con equipos Ares Paraguay cerca de ti. Contacto directo, ubicaciones y equipos disponibles.',
  generator: 'Ares Paraguay',
  icons: {
    icon: [
      { url: '/Isologo Simetrico.ico' },
      { url: '/images/isologo-ares.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/isologo-ares.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/Isologo Simetrico.ico',
    apple: '/images/isologo-ares.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
