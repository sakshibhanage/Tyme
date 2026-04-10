import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio reference — Jasmine style',
  description: 'Motion design portfolio layout reference.',
}

export default function JasmineLayout({ children }: { children: React.ReactNode }) {
  return children
}
