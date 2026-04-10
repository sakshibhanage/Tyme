import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tyme — Write your memory',
  description: 'Step one: title and message for your time-locked memory.',
}

export default function SealLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf5df] to-[#FFFDF5]">{children}</div>
  )
}
