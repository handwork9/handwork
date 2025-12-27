import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Handwork - Your Local Services Marketplace',
  description: 'Connect with skilled farmers, artisans, and service providers in your area. Fresh produce, quality services, delivered to your doorstep.',
  keywords: 'marketplace, local services, farmers, artisans, delivery, fresh produce',
  openGraph: {
    title: 'Handwork - Your Local Services Marketplace',
    description: 'Connect with skilled farmers, artisans, and service providers in your area.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
