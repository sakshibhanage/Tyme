type TymeBackgroundArtProps = { variant?: 'dark' | 'light' | 'jasmine' }

/**
 * Subtle outlined stationery motifs — tuned for dark canvas, warm cream landing, or near-black Jasmine UI.
 */
export function TymeBackgroundArt({ variant = 'dark' }: TymeBackgroundArtProps) {
  const light = variant === 'light'
  const jasmine = variant === 'jasmine'
  const stroke = jasmine
    ? 'rgba(255, 255, 255, 0.1)'
    : light
      ? 'rgba(139, 125, 58, 0.2)'
      : 'rgba(122, 106, 83, 0.35)'
  const strokeSoft = jasmine
    ? 'rgba(255, 255, 255, 0.06)'
    : light
      ? 'rgba(107, 102, 95, 0.16)'
      : 'rgba(122, 106, 83, 0.22)'
  const goldHint = jasmine
    ? 'rgba(255, 255, 255, 0.12)'
    : light
      ? 'rgba(139, 125, 58, 0.12)'
      : 'rgba(212, 175, 55, 0.15)'

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {light ? (
        <>
          {/* Large illustrations are back (kept within safe margins) */}
          {/* Envelope — top right */}
          <svg
            className="absolute right-[3%] top-[12%] h-[min(38vw,360px)] w-[min(50vw,460px)] opacity-[0.1] sm:right-[4%] sm:top-[14%]"
            viewBox="0 0 200 140"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
          >
            <rect x="8" y="28" width="184" height="96" rx="2" />
            <path d="M8 28 L100 88 L192 28" />
            <path d="M8 124 L76 72" stroke={strokeSoft} />
            <path d="M192 124 L124 72" stroke={strokeSoft} />
          </svg>

          {/* Letter / paper */}
          <svg
            className="absolute left-[3%] bottom-[16%] h-[min(34vw,300px)] w-[min(44vw,380px)] opacity-[0.09] sm:left-[4%]"
            viewBox="0 0 180 220"
            fill="none"
            stroke={stroke}
            strokeWidth="1"
          >
            <rect x="20" y="16" width="140" height="188" rx="2" />
            <line x1="40" y1="52" x2="140" y2="52" stroke={strokeSoft} />
            <line x1="40" y1="72" x2="120" y2="72" stroke={strokeSoft} />
            <line x1="40" y1="92" x2="130" y2="92" stroke={strokeSoft} />
            <path d="M20 48 L100 120 L160 48" stroke={goldHint} strokeWidth="0.8" />
          </svg>

          {/* Polaroid */}
          <svg
            className="absolute bottom-[10%] right-[6%] h-[min(24vw,220px)] w-[min(19vw,180px)] rotate-6 opacity-[0.09] sm:right-[8%]"
            viewBox="0 0 120 150"
            fill="none"
            stroke={stroke}
            strokeWidth="1.1"
          >
            <rect x="8" y="8" width="104" height="134" rx="3" />
            <rect x="16" y="16" width="88" height="88" rx="1" stroke={strokeSoft} />
            <circle cx="60" cy="132" r="3" stroke={goldHint} />
          </svg>

          {/* Pen */}
          <svg
            className="absolute left-[12%] top-[34%] h-[min(32vw,190px)] w-[min(10vw,44px)] -rotate-[28deg] opacity-[0.08] sm:left-[14%]"
            viewBox="0 0 40 200"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            <path d="M20 4 L20 168" />
            <path d="M14 168 L26 168 L22 196 L18 196 Z" fill="none" stroke={stroke} />
            <path d="M16 8 L24 8 L22 24 L18 24 Z" stroke={goldHint} />
          </svg>

          {/* Cute scattered mini doodles */}
          <svg
            className="absolute left-[6%] top-[10%] h-12 w-12 opacity-[0.1] sm:h-14 sm:w-14"
            viewBox="0 0 64 64"
            fill="none"
            stroke={strokeSoft}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M32 12 L35 26 L50 32 L35 38 L32 52 L29 38 L14 32 L29 26 Z" stroke={goldHint} />
          </svg>
          <svg
            className="absolute right-[22%] bottom-[22%] h-14 w-14 -rotate-6 opacity-[0.08] sm:h-16 sm:w-16"
            viewBox="0 0 64 64"
            fill="none"
            stroke={strokeSoft}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 28 C18 18 26 14 32 20 C38 14 46 18 46 28 C46 40 32 48 32 48 C32 48 18 40 18 28 Z" />
          </svg>
        </>
      ) : (
        <>
          {/* Envelope — top right */}
          <svg
            className={`absolute -right-[8%] top-[12%] h-[min(42vw,380px)] w-[min(55vw,480px)] sm:right-0 sm:top-[15%] ${jasmine ? 'opacity-[0.07]' : 'opacity-[0.14]'}`}
            viewBox="0 0 200 140"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
          >
            <rect x="8" y="28" width="184" height="96" rx="2" />
            <path d="M8 28 L100 88 L192 28" />
            <path d="M8 124 L76 72" stroke={strokeSoft} />
            <path d="M192 124 L124 72" stroke={strokeSoft} />
          </svg>

          {/* Letter / paper */}
          <svg
            className={`absolute -left-[5%] bottom-[18%] h-[min(38vw,320px)] w-[min(48vw,400px)] sm:left-[2%] ${jasmine ? 'opacity-[0.06]' : 'opacity-[0.12]'}`}
            viewBox="0 0 180 220"
            fill="none"
            stroke={stroke}
            strokeWidth="1"
          >
            <rect x="20" y="16" width="140" height="188" rx="2" />
            <line x1="40" y1="52" x2="140" y2="52" stroke={strokeSoft} />
            <line x1="40" y1="72" x2="120" y2="72" stroke={strokeSoft} />
            <line x1="40" y1="92" x2="130" y2="92" stroke={strokeSoft} />
            <path d="M20 48 L100 120 L160 48" stroke={goldHint} strokeWidth="0.8" />
          </svg>

          {/* Polaroid */}
          <svg
            className={`absolute bottom-[8%] right-[4%] h-[min(28vw,240px)] w-[min(22vw,200px)] rotate-6 sm:right-[8%] ${jasmine ? 'opacity-[0.065]' : 'opacity-[0.13]'}`}
            viewBox="0 0 120 150"
            fill="none"
            stroke={stroke}
            strokeWidth="1.1"
          >
            <rect x="8" y="8" width="104" height="134" rx="3" />
            <rect x="16" y="16" width="88" height="88" rx="1" stroke={strokeSoft} />
            <circle cx="60" cy="132" r="3" stroke={goldHint} />
          </svg>

          {/* Pen */}
          <svg
            className={`absolute left-[8%] top-[38%] h-[min(36vw,200px)] w-[min(12vw,48px)] -rotate-[32deg] sm:left-[12%] ${jasmine ? 'opacity-[0.055]' : 'opacity-[0.11]'}`}
            viewBox="0 0 40 200"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            <path d="M20 4 L20 168" />
            <path d="M14 168 L26 168 L22 196 L18 196 Z" fill="none" stroke={stroke} />
            <path d="M16 8 L24 8 L22 24 L18 24 Z" stroke={goldHint} />
          </svg>

          {/* Small envelope — mid left */}
          <svg
            className={`absolute left-[3%] top-[58%] hidden h-24 w-32 md:block ${jasmine ? 'opacity-[0.05]' : 'opacity-[0.1]'}`}
            viewBox="0 0 100 70"
            fill="none"
            stroke={strokeSoft}
            strokeWidth="1"
          >
            <rect x="4" y="14" width="92" height="48" rx="1" />
            <path d="M4 14 L50 44 L96 14" />
          </svg>
        </>
      )}
    </div>
  )
}
