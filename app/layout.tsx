import type { Metadata, Viewport } from 'next'
import { DM_Sans, Manrope, Noto_Serif, Syne } from 'next/font/google'
import { TymePenCursor } from '@/components/TymePenCursor'
import './globals.css'

const jasmineDisplay = Syne({
  subsets: ['latin'],
  variable: '--font-jasmine-display',
  weight: ['400', '500', '600', '700', '800'],
})

const jasmineUi = DM_Sans({
  subsets: ['latin'],
  variable: '--font-jasmine-ui',
  weight: ['400', '500', '600', '700'],
})

const tymeHeadline = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-tyme-headline',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const tymeBody = Manrope({
  subsets: ['latin'],
  variable: '--font-tyme-body',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Tyme — Seal your memory',
  description:
    'Everything encoded in one URL. No servers. No accounts. Time-locked memories in the browser.',
}

export const viewport: Viewport = {
  themeColor: '#1A1612',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jasmineDisplay.variable} ${jasmineUi.variable} ${tymeHeadline.variable} ${tymeBody.variable} jg-body min-h-screen antialiased`}
      >
        <TymePenCursor />
        {children}
      </body>
    </html>
  )
}
