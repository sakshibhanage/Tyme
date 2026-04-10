import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tyme — Seal flow',
  description: 'Create a time-locked memory — title, message, and more.',
}

export default function TymeLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-tyme-canvas text-tyme-text">{children}</div>
}
