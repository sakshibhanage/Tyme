import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tyme — Open memory',
  description: 'View a time-locked memory from your link.',
}

export default function OpenLayout({ children }: { children: React.ReactNode }) {
  return children
}
