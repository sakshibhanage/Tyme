'use client'

import { useEffect, useState } from 'react'

/** Live time string in America/New_York (jasmine-style header). */
export function useNYClock() {
  const [s, setS] = useState('')
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
        .format(new Date())
        .replace(/\u202f/g, ' ')
    setS(fmt())
    const id = window.setInterval(() => setS(fmt()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return s
}
