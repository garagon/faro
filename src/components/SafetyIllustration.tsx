// Original vector instructions. Text outside the drawing remains the authoritative instruction.
export type SafetyScene = 'drop' | 'cover' | 'hold' | 'coast' | 'stairs' | 'bag';
export default function SafetyIllustration({ scene }: { scene: SafetyScene }) {
  const person = (
    <g stroke="#183d38" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="139" cy="87" r="10" fill="#183d38" stroke="none" />
      <path d="M128 102 L102 119 L78 116 L62 142 L90 142 M106 119 L126 139 L146 139" />
    </g>
  );
  return (
    <svg
      className="fw-safety-illustration"
      viewBox="0 0 240 170"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="240" height="170" rx="12" fill="#f1f5f0" />
      <path d="M24 149 H216" stroke="#b8c8c0" strokeWidth="2" />
      {(scene === 'drop' || scene === 'cover' || scene === 'hold') && (
        <>
          {scene !== 'drop' && (
            <g fill="none" stroke="#58766c" strokeWidth="7" strokeLinejoin="round">
              <path d="M42 73 H195 V145 M48 73 V145" />
              <path d="M38 65 H202 V73 H38 Z" fill="#cedbcf" strokeWidth="3" />
            </g>
          )}
          {person}
          {scene === 'drop' && (
            <g fill="none" stroke="#a76727" strokeWidth="3">
              <path d="M174 76 V123 M166 115 L174 123 L182 115" />
            </g>
          )}
          {scene === 'cover' && (
            <path
              d="M124 139 L156 104 L142 75 L128 79"
              fill="none"
              stroke="#183d38"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {scene === 'hold' && (
            <>
              <path
                d="M122 139 L155 107 L142 77 L127 81 M124 110 L169 98 L194 99"
                fill="none"
                stroke="#183d38"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="194" cy="99" r="11" fill="none" stroke="#a76727" strokeWidth="2" />
            </>
          )}
        </>
      )}
      {scene === 'coast' && (
        <>
          <path
            d="M17 137 Q32 127 47 137 T77 137 M17 148 Q32 138 47 148 T77 148"
            fill="none"
            stroke="#317795"
            strokeWidth="4"
          />
          <path d="M87 149 L175 78 H220" fill="none" stroke="#58766c" strokeWidth="5" />
          <circle cx="131" cy="71" r="9" fill="#183d38" />
          <path
            d="M124 86 L110 110 L122 130 M117 101 L137 100 L148 110 M123 87 L138 86 L149 75"
            fill="none"
            stroke="#183d38"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M160 55 L196 35 M181 34 L196 35 L191 49"
            fill="none"
            stroke="#a76727"
            strokeWidth="3"
          />
        </>
      )}
      {scene === 'stairs' && (
        <>
          <path
            d="M30 75 H77 V98 H115 V122 H155 V146 H207"
            fill="none"
            stroke="#58766c"
            strokeWidth="5"
          />
          <circle cx="80" cy="36" r="9" fill="#183d38" />
          <path
            d="M80 51 L96 70 L82 86 M94 67 L115 76 L123 103 M82 54 L61 63 L47 62"
            fill="none"
            stroke="#183d38"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M148 52 L185 83 M186 69 L185 83 L171 82"
            fill="none"
            stroke="#a76727"
            strokeWidth="3"
          />
        </>
      )}
      {scene === 'bag' && (
        <>
          <path d="M94 53 V40 Q119 24 144 40 V53" fill="none" stroke="#183d38" strokeWidth="6" />
          <rect
            x="68"
            y="48"
            width="104"
            height="97"
            rx="23"
            fill="#d7e5d6"
            stroke="#183d38"
            strokeWidth="4"
          />
          <path d="M89 50 V135 M151 50 V135" stroke="#58766c" strokeWidth="5" />
          <rect
            x="94"
            y="94"
            width="53"
            height="37"
            rx="6"
            fill="#fafbf8"
            stroke="#58766c"
            strokeWidth="3"
          />
          <path d="M109 110 H131 M120 100 V121" stroke="#183d38" strokeWidth="4" />
          <rect
            x="24"
            y="79"
            width="25"
            height="59"
            rx="6"
            fill="#e3f2f8"
            stroke="#317795"
            strokeWidth="3"
          />
          <path d="M30 79 V71 H43 V79 M29 106 H44" fill="none" stroke="#317795" strokeWidth="3" />
          <path
            d="M192 94 L199 62 L215 65 L208 99 Z M194 101 L205 104 L201 128 L190 125 Z"
            fill="#f2dfb0"
            stroke="#8d642b"
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  );
}
