import { useId, type ReactNode } from 'react';
import { pick, type Lang } from '../lib/i18n.ts';

/*
 * Original explanatory diagrams: cross-sections, floor plans and a timeline. They show where
 * things are; the written steps remain the instruction. Labels repeat what the text says and
 * never add thresholds the text does not state.
 */
export type SafetyScene =
  | 'coast'
  | 'street'
  | 'storm'
  | 'timeline'
  | 'flood'
  | 'aftermath'
  | 'ash'
  | 'message'
  | 'hotel'
  | 'exit'
  | 'bag';

type Pt = [number, number];
type Ctx = { t: (es: string, en: string, pt: string) => string; ref: (name: string) => string };

const FONT = "'Public Sans', system-ui, sans-serif";
const INK = '#1d3a35';
const LINE = '#7d918a';
const WATER = '#2b6c8c';
const WATER_WASH = '#dbeaf1';
const DANGER = '#b4531a';
const SAFE = '#2d7650';
const SAFE_WASH = '#e1f0e6';
const AMBER = '#9a6512';
const ROAD = '#e7ece9';

function Label({
  x,
  y,
  lines,
  anchor = 'start',
  color = INK,
  weight = 500,
  size = 14,
  halo = true,
}: {
  x: number;
  y: number;
  lines: string[];
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  weight?: number;
  size?: number;
  halo?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={color}
      fontSize={size}
      fontWeight={weight}
      fontFamily={FONT}
      {...(halo
        ? { stroke: '#fff', strokeWidth: 4, strokeLinejoin: 'round' as const, paintOrder: 'stroke' }
        : {})}
    >
      {lines.map((line, n) => (
        <tspan key={n} x={x} dy={n ? size * 1.28 : 0}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** Thin leader from a label to the thing it names, ending in a dot. */
function Leader({ points }: { points: Pt[] }) {
  const end = points[points.length - 1];
  return (
    <g>
      <path
        d={points.map(([x, y], n) => `${n ? 'L' : 'M'}${x} ${y}`).join(' ')}
        fill="none"
        stroke={INK}
        strokeWidth={1}
      />
      <circle cx={end[0]} cy={end[1]} r={2.6} fill={INK} />
    </g>
  );
}

/** Pictogram figure with its feet at (x, y); 57 units tall at scale 1. */
function Person({
  x,
  y,
  s = 1,
  pose = 'stand',
  color = INK,
}: {
  x: number;
  y: number;
  s?: number;
  pose?: 'stand' | 'walk';
  color?: string;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${s})`}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx={pose === 'walk' ? 3 : 0} cy={-51} r={6.2} fill={color} stroke="none" />
      {pose === 'walk' ? (
        <>
          <path d="M1.5 -41 L-1.5 -23" strokeWidth={9} />
          <path d="M-1.5 -23 L-8 -12 L-15 -3" strokeWidth={6.5} />
          <path d="M-1.5 -23 L7 -12 L9 -1" strokeWidth={6.5} />
          <path d="M1 -38 L-6 -30 L-11 -24" strokeWidth={5} />
          <path d="M2 -38 L9 -31 L15 -35" strokeWidth={5} />
        </>
      ) : (
        <>
          <path d="M0 -41 V-23" strokeWidth={9} />
          <path d="M-2 -23 L-3.5 -1 M2 -23 L3.5 -1" strokeWidth={6} />
          <path d="M-2 -38 L-7.5 -25 M2 -38 L7.5 -25" strokeWidth={5} />
        </>
      )}
    </g>
  );
}

function wave(x0: number, x1: number, y: number, amp = 2.2, period = 24) {
  let d = '';
  for (let x = x0; x <= x1; x += 3)
    d += ` L${x} ${(y + Math.sin((x / period) * Math.PI * 2) * amp).toFixed(1)}`;
  return d;
}

/** Horizontal dimension-style bracket with end ticks. */
function Bracket({ x0, x1, y, color }: { x0: number; x1: number; y: number; color: string }) {
  return (
    <path
      d={`M${x0} ${y - 6} V${y} H${x1} V${y - 6}`}
      fill="none"
      stroke={color}
      strokeWidth={1.6}
    />
  );
}

/** Vertical measurement between two heights, with ticks at both ends. */
function Dimension({ x, y0, y1 }: { x: number; y0: number; y1: number }) {
  return (
    <path
      d={`M${x} ${y0} V${y1} M${x - 5} ${y0} H${x + 5} M${x - 5} ${y1} H${x + 5}`}
      stroke={INK}
      strokeWidth={1.4}
      fill="none"
    />
  );
}

function NoSign({ x, y, r = 15 }: { x: number; y: number; r?: number }) {
  const k = r * 0.7;
  return (
    <g fill="none" stroke={DANGER} strokeWidth={3}>
      <circle cx={x} cy={y} r={r} />
      <path d={`M${x - k} ${y - k} L${x + k} ${y + k}`} />
    </g>
  );
}

const drawings: Record<SafetyScene, (c: Ctx) => { label: string; body: ReactNode }> = {
  coast: ({ t, ref }) => {
    const land =
      'M0 272 L110 232 L150 206 L178 199 L270 195 L300 189 L360 140 L410 108 L480 98 L480 300 L0 300 Z';
    const surface = `M0 214${wave(0, 138, 214)}`;
    return {
      label: t(
        'Corte de una costa. Ante un sismo fuerte, un cambio del nivel del mar o un rugido del océano, sal a pie hacia terreno alto o tierra adentro sin esperar una alerta.',
        'Cross-section of a coast. After strong shaking, an unusual sea level change or an ocean roar, go on foot to high ground or inland without waiting for an alert.',
        'Corte de uma costa. Diante de um terremoto forte, uma mudança incomum do nível do mar ou um rugido do oceano, vá a pé para um terreno alto ou para o interior sem esperar um alerta.',
      ),
      body: (
        <>
          <path d={`${surface} L110 232 L0 272 Z`} fill={WATER_WASH} />
          <path d={surface} fill="none" stroke={WATER} strokeWidth={2} />
          <path d="M0 196 H170" stroke={WATER} strokeWidth={1.2} strokeDasharray="5 4" />
          <Label
            x={8}
            y={190}
            size={12}
            color={WATER}
            lines={[t('Nivel habitual', 'Usual level', 'Nível habitual')]}
          />
          <path d="M128 199 V209" stroke={WATER} strokeWidth={1.6} markerEnd={ref('arrow-water')} />
          <path d={land} fill={ref('ground')} stroke={INK} strokeWidth={1.6} />
          <Label
            x={16}
            y={32}
            weight={700}
            lines={[t('Señales naturales', 'Natural warning signs', 'Sinais naturais')]}
          />
          {[
            t('Sismo fuerte o prolongado', 'Strong or long shaking', 'Terremoto forte ou longo'),
            t(
              'El mar baja o sube de golpe',
              'Sea suddenly drops or rises',
              'O mar baixa ou sobe de repente',
            ),
            t('Rugido del océano', 'Ocean roar', 'Rugido do oceano'),
          ].map((text, n) => (
            <g key={n}>
              <rect x={16} y={47 + n * 20} width={7} height={7} fill={DANGER} />
              <Label x={30} y={55 + n * 20} size={13.5} lines={[text]} />
            </g>
          ))}
          <Bracket x0={156} x1={292} y={224} color={DANGER} />
          <Label
            x={224}
            y={244}
            anchor="middle"
            size={13}
            weight={600}
            color={DANGER}
            lines={[t('Zona costera baja', 'Low-lying coast', 'Costa baixa')]}
          />
          <Person x={196} y={197} s={0.82} pose="walk" />
          <path
            d="M222 184 L272 182 L300 176 L356 129 L398 101"
            fill="none"
            stroke={SAFE}
            strokeWidth={3}
            strokeDasharray="8 5"
            markerEnd={ref('arrow-safe')}
          />
          <path d="M432 100 V64" stroke={INK} strokeWidth={2} />
          <path d="M432 64 L454 72 L432 80 Z" fill={SAFE} />
          <Label
            x={470}
            y={34}
            anchor="end"
            weight={700}
            color={SAFE}
            lines={[t('Terreno alto', 'High ground', 'Terreno alto')]}
          />
          <Label
            x={470}
            y={52}
            anchor="end"
            color={SAFE}
            lines={[t('o tierra adentro', 'or inland', 'ou o interior')]}
          />
          <Label
            x={332}
            y={112}
            anchor="end"
            size={13.5}
            weight={600}
            color={SAFE}
            lines={[
              t('Ve a pie, sin esperar', 'Go on foot, without', 'Vá a pé, sem esperar'),
              t('una alerta oficial', 'waiting for an alert', 'um alerta oficial'),
            ]}
          />
        </>
      ),
    };
  },

  street: ({ t, ref }) => ({
    label: t(
      'Plano de una calle. Aléjate de fachadas, postes y cables; si conduces, detente después de salir del puente y quédate en un espacio abierto.',
      'Plan of a street. Keep away from facades, poles and power lines; if driving, stop after leaving the bridge and stay in an open space.',
      'Planta de uma rua. Afaste-se de fachadas, postes e fios elétricos; se estiver dirigindo, pare depois de sair da ponte e fique em um espaço aberto.',
    ),
    body: (
      <>
        <rect x={124} y={0} width={90} height={300} fill={WATER_WASH} />
        {[30, 70, 250, 285].map((y) => (
          <path
            key={y}
            d={`M124 ${y}${wave(124, 214, y, 1.6, 18)}`}
            fill="none"
            stroke={WATER}
            strokeWidth={1}
            opacity={0.6}
          />
        ))}
        {[
          [12, 12, 96, 74],
          [230, 12, 110, 74],
          [350, 12, 118, 74],
        ].map(([x, y, w, h]) => (
          <rect
            key={x}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={ref('ground')}
            stroke={INK}
            strokeWidth={1.4}
          />
        ))}
        <rect x={12} y={86} width={96} height={28} fill={ref('danger')} />
        <rect x={230} y={86} width={238} height={28} fill={ref('danger')} />
        <rect x={0} y={114} width={480} height={72} fill={ROAD} />
        <path d="M0 150 H480" stroke="#fff" strokeWidth={2} strokeDasharray="14 10" />
        <path d="M116 114 H222 M116 186 H222" stroke={INK} strokeWidth={3.5} />
        <rect x={0} y={186} width={124} height={20} fill="#f2f5f3" />
        <rect x={214} y={186} width={266} height={20} fill="#f2f5f3" />
        <path d="M60 196 L250 196 L452 196" stroke={INK} strokeWidth={1} />
        {[60, 250, 452].map((x) => (
          <g key={x}>
            <circle
              cx={x}
              cy={196}
              r={18}
              fill="none"
              stroke={DANGER}
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            <circle cx={x} cy={196} r={4.5} fill={INK} />
          </g>
        ))}
        <g transform="translate(28 158)">
          <rect width={46} height={22} rx={6} fill={INK} />
          <rect x={28} y={3} width={9} height={16} rx={2} fill="#9fb3ab" />
          <rect x={6} y={3} width={7} height={16} rx={2} fill="#9fb3ab" />
        </g>
        <path
          d="M80 169 H314"
          stroke={INK}
          strokeWidth={1.6}
          strokeDasharray="6 5"
          markerEnd={ref('arrow-ink')}
        />
        <circle cx={330} cy={169} r={9} fill={SAFE} />
        <path d="M326 165 H334 V173 H326 Z" fill="#fff" />
        <Label
          x={10}
          y={132}
          size={12.5}
          halo={false}
          lines={[t('Reduce', 'Slow', 'Reduza'), t('la velocidad', 'down', 'a velocidade')]}
        />
        <Label
          x={169}
          y={140}
          anchor="middle"
          size={12.5}
          weight={600}
          halo={false}
          lines={[t('Puente', 'Bridge', 'Ponte')]}
        />
        <Label
          x={334}
          y={140}
          anchor="middle"
          size={13}
          weight={600}
          halo={false}
          color={SAFE}
          lines={[t('Detente después del puente', 'Stop after the bridge', 'Pare depois da ponte')]}
        />
        <Label
          x={240}
          y={105}
          size={13}
          weight={600}
          color={DANGER}
          lines={[
            t(
              'Vidrios y fachadas pueden caer',
              'Glass and facades can fall',
              'Vidros e fachadas podem cair',
            ),
          ]}
        />
        <Label
          x={14}
          y={236}
          size={13}
          weight={600}
          color={DANGER}
          lines={[t('Postes y cables', 'Poles and lines', 'Postes e fios')]}
        />
        <Leader
          points={[
            [40, 224],
            [54, 210],
          ]}
        />
        <rect
          x={230}
          y={222}
          width={238}
          height={68}
          rx={6}
          fill={SAFE_WASH}
          stroke={SAFE}
          strokeWidth={1.4}
        />
        <Label
          x={246}
          y={250}
          weight={700}
          color={SAFE}
          halo={false}
          lines={[t('Espacio abierto', 'Open space', 'Espaço aberto')]}
        />
        <Label
          x={246}
          y={270}
          size={13}
          color={SAFE}
          halo={false}
          lines={[
            t(
              'lejos de edificios y cables',
              'away from buildings and lines',
              'longe de prédios e fios',
            ),
          ]}
        />
      </>
    ),
  }),

  storm: ({ t, ref }) => {
    // Window openings: [x, y, length, vertical]
    const windows: [number, number, number, boolean][] = [
      [96, 50, 50, true],
      [96, 170, 50, true],
      [205, 24, 36, false],
      [276, 24, 40, false],
      [336, 46, 50, true],
      [336, 190, 50, true],
      [116, 276, 50, false],
    ];
    const strip = ([x, y, l, v]: [number, number, number, boolean]) =>
      v
        ? { x: x === 96 ? 99 : 313, y: y - 4, w: 20, h: l + 8 }
        : { x: x - 4, y: y === 24 ? 27 : 253, w: l + 8, h: 20 };
    return {
      label: t(
        'Plano de una vivienda durante un huracán. Refúgiate en una habitación interior pequeña, armario o pasillo, lejos de ventanas y puertas de vidrio.',
        'Floor plan during a hurricane. Shelter in a small interior room, closet or hallway, away from windows and glass doors.',
        'Planta de uma casa durante um furacão. Abrigue-se em um cômodo interno pequeno, armário ou corredor, longe de janelas e portas de vidro.',
      ),
      body: (
        <>
          {[90, 150, 210].map((y) => (
            <path
              key={y}
              d={`M14 ${y} H74`}
              stroke={WATER}
              strokeWidth={2}
              markerEnd={ref('arrow-water')}
            />
          ))}
          <Label x={14} y={70} weight={700} lines={[t('Viento', 'Wind', 'Vento')]} />
          <rect x={96} y={24} width={240} height={252} fill="#fff" />
          {windows.map((w) => {
            const s = strip(w);
            return (
              <rect
                key={`${w[0]}-${w[1]}`}
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                fill={ref('danger')}
              />
            );
          })}
          <rect x={189} y={103} width={64} height={74} fill={SAFE_WASH} />
          <rect x={96} y={24} width={240} height={252} fill="none" stroke={INK} strokeWidth={6} />
          <path
            d="M186 24 V200 M186 228 V276 M256 24 V60 M256 88 V200 M256 228 V276 M186 100 H256 M186 180 H206 M236 180 H256 M256 150 H336"
            stroke={INK}
            strokeWidth={3.5}
            fill="none"
          />
          <path d="M206 180 V152 A28 28 0 0 1 234 180" fill="none" stroke={LINE} strokeWidth={1} />
          <path d="M186 228 H214 A28 28 0 0 0 186 200" fill="none" stroke={LINE} strokeWidth={1} />
          {windows.map(([x, y, l, v]) =>
            v ? (
              <g key={`w${x}-${y}`}>
                <rect x={x - 4} y={y} width={8} height={l} fill="#fff" />
                <path
                  d={`M${x - 3} ${y} V${y + l} M${x} ${y} V${y + l} M${x + 3} ${y} V${y + l}`}
                  stroke={INK}
                  strokeWidth={1}
                />
              </g>
            ) : (
              <g key={`w${x}-${y}`}>
                <rect x={x} y={y - 4} width={l} height={8} fill="#fff" />
                <path
                  d={`M${x} ${y - 3} H${x + l} M${x} ${y} H${x + l} M${x} ${y + 3} H${x + l}`}
                  stroke={INK}
                  strokeWidth={1}
                />
              </g>
            ),
          )}
          <Label
            x={141}
            y={150}
            anchor="middle"
            size={12}
            color={LINE}
            halo={false}
            lines={[t('Sala', 'Living', 'Sala')]}
          />
          <Label
            x={296}
            y={92}
            anchor="middle"
            size={12}
            color={LINE}
            halo={false}
            lines={[t('Dormitorio', 'Bedroom', 'Quarto')]}
          />
          <Label
            x={221}
            y={66}
            anchor="middle"
            size={12}
            color={LINE}
            halo={false}
            lines={[t('Cocina', 'Kitchen', 'Cozinha')]}
          />
          <Label
            x={350}
            y={110}
            weight={700}
            color={SAFE}
            lines={[t('Habitación', 'Small interior', 'Cômodo'), t('interior', 'room', 'interno')]}
          />
          <Label
            x={350}
            y={150}
            size={12.5}
            lines={[
              t('pasillo, armario o', 'hallway, closet or', 'corredor, armário'),
              t('baño sin ventanas', 'inner bathroom', 'ou banheiro interno'),
            ]}
          />
          <Leader
            points={[
              [346, 116],
              [300, 130],
              [240, 140],
            ]}
          />
          <Label
            x={350}
            y={214}
            weight={700}
            color={DANGER}
            lines={[t('Lejos de ventanas', 'Avoid windows', 'Longe de janelas')]}
          />
          <Label
            x={350}
            y={232}
            size={12.5}
            lines={[
              t('tragaluces y puertas', 'skylights and glass', 'claraboias e portas'),
              t('de vidrio', 'doors', 'de vidro'),
            ]}
          />
          <Leader
            points={[
              [346, 210],
              [324, 214],
            ]}
          />
        </>
      ),
    };
  },

  timeline: ({ t }) => {
    const rows: { y: number; time: string; color: string; title: string; lines: string[] }[] = [
      {
        y: 52,
        time: t('48 h antes', '48 h before', '48 h antes'),
        color: AMBER,
        title: t('Vigilancia de huracán', 'Hurricane watch', 'Vigilância de furacão'),
        lines: [
          t(
            'Condiciones de huracán posibles. Prepárate:',
            'Hurricane conditions possible. Prepare:',
            'Condições de furacão possíveis. Prepare-se:',
          ),
          t(
            'ruta de evacuación, batería, medicamentos.',
            'evacuation route, battery, medication.',
            'rota de evacuação, bateria, medicamentos.',
          ),
        ],
      },
      {
        y: 132,
        time: t('36 h antes', '36 h before', '36 h antes'),
        color: DANGER,
        title: t('Aviso de huracán', 'Hurricane warning', 'Aviso de furacão'),
        lines: [
          t(
            'Condiciones esperadas. Termina los',
            'Conditions expected. Finish',
            'Condições esperadas. Termine os',
          ),
          t(
            'preparativos y evacúa si lo ordenan.',
            'preparing; evacuate if ordered.',
            'preparativos e evacue se for ordenado.',
          ),
        ],
      },
      {
        y: 212,
        time: t('Llegada', 'Arrival', 'Chegada'),
        color: INK,
        title: t(
          'Vientos de tormenta tropical',
          'Tropical-storm-force winds',
          'Ventos de tempestade tropical',
        ),
        lines: [
          t(
            '63 km/h o más. Huracán: 119 km/h o más.',
            '39 mph or more. Hurricane: 74 mph or more.',
            '63 km/h ou mais. Furacão: 119 km/h ou mais.',
          ),
          t('Quédate en tu refugio.', 'Stay in your shelter.', 'Fique no seu abrigo.'),
        ],
      },
    ];
    return {
      label: t(
        'Línea de tiempo de los avisos del Centro Nacional de Huracanes: vigilancia unas 48 horas y aviso unas 36 horas antes de los vientos de tormenta tropical.',
        'Timeline of National Hurricane Center products: a watch about 48 hours and a warning about 36 hours before tropical-storm-force winds.',
        'Linha do tempo dos avisos do Centro Nacional de Furacões: vigilância cerca de 48 horas e aviso cerca de 36 horas antes dos ventos de tempestade tropical.',
      ),
      body: (
        <>
          <path d="M112 52 V132" stroke={AMBER} strokeWidth={5} />
          <path d="M112 132 V212" stroke={DANGER} strokeWidth={5} />
          <path d="M112 212 V262" stroke={INK} strokeWidth={5} />
          {rows.map((r) => (
            <g key={r.y}>
              <circle cx={112} cy={r.y} r={8} fill="#fff" stroke={r.color} strokeWidth={3} />
              <Label
                x={92}
                y={r.y + 5}
                anchor="end"
                size={13}
                weight={600}
                color={r.color}
                lines={[r.time]}
              />
              <Label x={134} y={r.y + 5} weight={700} color={r.color} lines={[r.title]} />
              <Label x={134} y={r.y + 25} size={13} lines={r.lines} />
            </g>
          ))}
          <Label
            x={16}
            y={290}
            size={11.5}
            color={LINE}
            lines={[
              t(
                'Términos del NHC de EE. UU. Cada país emite sus avisos con su propia escala.',
                'U.S. NHC terms. Each country issues warnings on its own scale.',
                'Termos do NHC dos EUA. Cada país emite seus avisos com sua própria escala.',
              ),
            ]}
          />
        </>
      ),
    };
  },

  flood: ({ t, ref }) => {
    const flow = (x0: number, x1: number, y: number) =>
      Array.from({ length: Math.floor((x1 - x0) / 48) }, (_, n) => x0 + 12 + n * 48).map((x) => (
        <path
          key={x}
          d={`M${x} ${y} H${x + 22}`}
          stroke={WATER}
          strokeWidth={1.4}
          markerEnd={ref('arrow-water')}
        />
      ));
    return {
      label: t(
        'Escala del agua. 15 centímetros de agua en movimiento pueden derribar a una persona y 30 centímetros pueden arrastrar un vehículo.',
        'Water depth to scale. Six inches of moving water can knock a person down and one foot can sweep a vehicle away.',
        'Profundidade da água em escala. 15 centímetros de água em movimento podem derrubar uma pessoa e 30 centímetros podem arrastar um veículo.',
      ),
      body: (
        <>
          <Label
            x={16}
            y={32}
            weight={700}
            lines={[
              t(
                'No camines ni manejes por agua de inundación',
                'Do not walk or drive through flood water',
                'Não ande nem dirija por água de inundação',
              ),
            ]}
          />
          <path d="M240 54 V256" stroke="#d6dfda" strokeWidth={1} />
          <rect x={0} y={236} width={480} height={64} fill={ref('ground')} />
          <path d="M0 236 H480" stroke={INK} strokeWidth={1.6} />
          <Person x={110} y={236} s={2.6} />
          <rect x={16} y={223} width={208} height={13} fill={WATER_WASH} opacity={0.92} />
          <path
            d={`M16 223${wave(16, 224, 223, 1.2, 16)}`}
            fill="none"
            stroke={WATER}
            strokeWidth={1.8}
          />
          {flow(16, 224, 214)}
          <Dimension x={196} y0={223} y1={236} />
          <Label
            x={188}
            y={208}
            anchor="end"
            size={14}
            weight={700}
            lines={[t('15 cm', '6 in', '15 cm')]}
          />
          <g transform="translate(14 0)">
            <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
              <path
                d="M290 224 L290 204 Q292 198 300 196 L332 192 L356 170 L414 170 L438 192 L456 196 Q462 198 462 206 L462 224 Z"
                fill="#e3e9e5"
              />
              <path
                d="M342 192 L362 176 L384 176 L384 192 Z M392 176 L410 176 L428 192 L392 192 Z"
                fill="#fff"
                strokeWidth={1.2}
              />
            </g>
            {[322, 430].map((x) => (
              <g key={x}>
                <circle cx={x} cy={221} r={15} fill={INK} />
                <circle cx={x} cy={221} r={6} fill="#c9d3ce" />
              </g>
            ))}
          </g>
          <rect x={246} y={222} width={234} height={14} fill={WATER_WASH} opacity={0.92} />
          <path
            d={`M246 222${wave(246, 480, 222, 1.2, 16)}`}
            fill="none"
            stroke={WATER}
            strokeWidth={1.8}
          />
          {flow(300, 480, 212)}
          <Dimension x={268} y0={222} y1={236} />
          <Label x={246} y={206} size={14} weight={700} lines={[t('30 cm', '1 ft', '30 cm')]} />
          <Label
            x={16}
            y={264}
            weight={600}
            lines={[
              t(
                '15 cm de agua en movimiento',
                '6 inches of moving water',
                '15 cm de água em movimento',
              ),
              t('pueden derribarte', 'can knock you down', 'podem derrubar você'),
            ]}
          />
          <Label
            x={256}
            y={264}
            weight={600}
            lines={[
              t('30 cm pueden arrastrar', '1 foot can sweep', '30 cm podem arrastrar'),
              t('un vehículo', 'a vehicle away', 'um veículo'),
            ]}
          />
        </>
      ),
    };
  },

  aftermath: ({ t, ref }) => ({
    label: t(
      'Después de la tormenta. No entres al agua de inundación, aléjate de los cables caídos y nunca uses un generador dentro de un edificio o garaje.',
      'After the storm. Stay out of flood water, keep away from fallen power lines and never run a generator inside a building or garage.',
      'Depois da tempestade. Não entre na água de inundação, afaste-se de fios elétricos caídos e nunca use um gerador dentro de um prédio ou garagem.',
    ),
    body: (
      <>
        <path
          d="M0 230 H40 L60 252 H160 L180 230 H480 V300 H0 Z"
          fill={ref('ground')}
          stroke={INK}
          strokeWidth={1.6}
        />
        <path d={`M47 238${wave(47, 173, 238, 1.4, 18)} L160 252 H60 Z`} fill={WATER_WASH} />
        <path
          d={`M47 238${wave(47, 173, 238, 1.4, 18)}`}
          fill="none"
          stroke={WATER}
          strokeWidth={1.8}
        />
        <path d="M220 230 V110 M204 118 H236" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d="M236 118 Q290 146 340 146" fill="none" stroke={INK} strokeWidth={1.2} />
        <path d="M204 118 Q150 150 128 238" fill="none" stroke={DANGER} strokeWidth={2} />
        {[10, 18].map((r) => (
          <path
            key={r}
            d={`M${128 - r} 238 A${r} ${r * 0.45} 0 0 0 ${128 + r} 238`}
            fill="none"
            stroke={DANGER}
            strokeWidth={1.2}
          />
        ))}
        <path
          d="M122 232 L127 226 L124 222 L130 216"
          fill="none"
          stroke={DANGER}
          strokeWidth={1.6}
        />
        <path
          d="M330 140 L400 96 L470 140 Z"
          fill="#fff"
          stroke={INK}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <rect x={340} y={140} width={120} height={90} fill="#fff" stroke={INK} strokeWidth={1.8} />
        <rect
          x={350}
          y={158}
          width={30}
          height={26}
          fill={WATER_WASH}
          stroke={INK}
          strokeWidth={1.2}
        />
        <rect x={426} y={186} width={22} height={44} fill="#fff" stroke={INK} strokeWidth={1.2} />
        <rect x={386} y={212} width={26} height={18} rx={2} fill={LINE} />
        <NoSign x={399} y={215} r={16} />
        <rect x={262} y={212} width={30} height={18} rx={2} fill={INK} />
        <path d="M258 214 q-8 -6 -2 -12 q6 -6 -2 -12" fill="none" stroke={LINE} strokeWidth={1.4} />
        <path d="M250 218 q-8 -6 -2 -12 q6 -6 -2 -12" fill="none" stroke={LINE} strokeWidth={1.4} />
        <Label
          x={16}
          y={40}
          weight={700}
          color={DANGER}
          lines={[t('Cable caído', 'Fallen power line', 'Fio elétrico caído')]}
        />
        <Label
          x={16}
          y={58}
          size={13}
          lines={[
            t(
              'el agua puede tener corriente',
              'water may be energized',
              'a água pode estar eletrificada',
            ),
          ]}
        />
        <Leader
          points={[
            [60, 66],
            [112, 212],
          ]}
        />
        <Label
          x={470}
          y={40}
          anchor="end"
          weight={700}
          color={DANGER}
          lines={[
            t('Generador: nunca adentro', 'Generator: never indoors', 'Gerador: nunca dentro'),
          ]}
        />
        <Label
          x={470}
          y={58}
          anchor="end"
          size={13}
          lines={[t('ni en el garaje', 'or in a garage', 'nem na garagem')]}
        />
        <Leader
          points={[
            [440, 66],
            [412, 198],
          ]}
        />
        <Label
          x={277}
          y={262}
          anchor="middle"
          size={13}
          weight={600}
          color={SAFE}
          lines={[
            t('Afuera, lejos', 'Outside, away', 'Fora, longe'),
            t('de ventanas', 'from windows', 'de janelas'),
          ]}
        />
        <Label
          x={110}
          y={278}
          anchor="middle"
          size={13}
          weight={600}
          color={DANGER}
          lines={[
            t('Agua de inundación:', 'Flood water:', 'Água de inundação:'),
            t('no entres', 'stay out', 'não entre'),
          ]}
        />
      </>
    ),
  }),

  ash: ({ t, ref }) => {
    const dots: Pt[] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let n = 0; n < 150; n++) {
      const x = 170 + rnd() * 270,
        y = 96 + rnd() * 140;
      if (rnd() > (x - 170) / 330) dots.push([x, y]);
    }
    return {
      label: t(
        'Corte de un volcán con el viento llevando la ceniza. Evita las zonas a favor del viento, quédate adentro con puertas y ventanas cerradas y, si sales, usa una mascarilla N95.',
        'Cross-section of a volcano with wind carrying ash. Avoid downwind areas, stay indoors with doors and windows closed and wear an N95 mask if you go out.',
        'Corte de um vulcão com o vento levando as cinzas. Evite as áreas para onde o vento sopra, fique em ambiente fechado com portas e janelas fechadas e, se sair, use uma máscara N95.',
      ),
      body: (
        <>
          <g fill="#d3d9d6">
            {[
              [108, 104, 16],
              [120, 82, 22],
              [148, 62, 26],
              [190, 54, 28],
              [236, 54, 28],
              [282, 58, 25],
              [326, 64, 21],
              [364, 70, 17],
              [396, 76, 12],
            ].map(([cx, cy, r]) => (
              <circle key={cx} cx={cx} cy={cy} r={r} />
            ))}
          </g>
          <g fill="#8e9a95">
            {dots.map(([x, y], n) => (
              <circle key={n} cx={x.toFixed(1)} cy={y.toFixed(1)} r={1.5} />
            ))}
          </g>
          <path
            d="M10 244 L92 120 H122 L210 244 Z"
            fill="#e3e8e5"
            stroke={INK}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <rect x={0} y={244} width={480} height={56} fill={ref('ground')} />
          <path d="M0 244 H480" stroke={INK} strokeWidth={1.6} />
          <path d="M404 26 H466" stroke={INK} strokeWidth={2} markerEnd={ref('arrow-ink')} />
          <Label x={396} y={31} anchor="end" weight={700} lines={[t('Viento', 'Wind', 'Vento')]} />
          <path
            d="M398 198 L433 174 L468 198 Z"
            fill="#fff"
            stroke={INK}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <rect x={404} y={198} width={58} height={46} fill="#fff" stroke={INK} strokeWidth={1.6} />
          <rect x={412} y={208} width={16} height={14} fill="#fff" stroke={INK} strokeWidth={1.2} />
          <path d="M412 215 H428 M420 208 V222" stroke={INK} strokeWidth={1} />
          <rect x={438} y={214} width={14} height={30} fill="#fff" stroke={INK} strokeWidth={1.2} />
          <Label
            x={394}
            y={192}
            anchor="end"
            size={13}
            weight={600}
            lines={[
              t(
                'Adentro, ventanas cerradas',
                'Indoors, windows closed',
                'Dentro, janelas fechadas',
              ),
            ]}
          />
          <Label
            x={394}
            y={212}
            anchor="end"
            size={13}
            weight={600}
            lines={[t('Si sales: mascarilla N95', 'Outside: N95 mask', 'Se sair: máscara N95')]}
          />
          <Bracket x0={12} x1={210} y={262} color={DANGER} />
          <Label
            x={111}
            y={279}
            anchor="middle"
            size={13}
            weight={600}
            color={DANGER}
            lines={[
              t('Zona de evacuación', 'Evacuation zone', 'Zona de evacuação'),
              t('la fija la autoridad', 'set by officials', 'definida pela autoridade'),
            ]}
          />
          <Bracket x0={222} x1={468} y={262} color={INK} />
          <Label
            x={345}
            y={279}
            anchor="middle"
            size={13}
            weight={600}
            lines={[
              t('Ceniza a favor del viento', 'Ash downwind', 'Cinzas na direção do vento'),
              t('evita la zona', 'avoid the area', 'evite a área'),
            ]}
          />
        </>
      ),
    };
  },

  message: ({ t }) => {
    const text = [
      t('Estoy bien.', 'I’m OK.', 'Estou bem.'),
      t('Hotel en El Cangrejo,', 'Hotel in El Cangrejo,', 'Hotel em El Cangrejo,'),
      t('Ciudad de Panamá.', 'Panama City.', 'Cidade do Panamá.'),
      t('Me quedo aquí.', 'Staying here.', 'Vou ficar aqui.'),
      t('Escribo a las 18:00.', 'Next update 6 pm.', 'Escrevo às 18h.'),
    ];
    return {
      label: t(
        'Ejemplo de mensaje: cómo estás, dónde estás, si te trasladas y cuándo volverás a escribir. Por SMS, que usa menos red que una llamada.',
        'Example message: how you are, where you are, whether you are moving and when you will write again. By SMS, which uses less network than a call.',
        'Exemplo de mensagem: como você está, onde está, se está se deslocando e quando vai escrever de novo. Por SMS, que usa menos rede do que uma ligação.',
      ),
      body: (
        <>
          <rect
            x={150}
            y={14}
            width={180}
            height={320}
            rx={26}
            fill="#fff"
            stroke={INK}
            strokeWidth={3}
          />
          <rect x={160} y={24} width={160} height={300} rx={18} fill="#f4f7f5" />
          <Label
            x={240}
            y={50}
            anchor="middle"
            size={12.5}
            weight={600}
            halo={false}
            lines={[t('Contacto principal', 'Main contact', 'Contato principal')]}
          />
          <path d="M160 62 H320" stroke="#dfe6e2" strokeWidth={1} />
          <rect x={172} y={78} width={140} height={98} rx={12} fill={SAFE_WASH} />
          <Label x={182} y={98} size={12.5} halo={false} lines={text} />
          <Label
            x={310}
            y={194}
            anchor="end"
            size={11}
            color={LINE}
            halo={false}
            lines={[t('SMS enviado 14:20', 'SMS sent 2:20 pm', 'SMS enviado 14h20')]}
          />
          <Label
            x={140}
            y={98}
            anchor="end"
            weight={600}
            lines={[t('Cómo estás', 'How you are', 'Como você está')]}
          />
          <Leader
            points={[
              [144, 94],
              [176, 94],
            ]}
          />
          <Label
            x={140}
            y={134}
            anchor="end"
            weight={600}
            lines={[t('Dónde estás', 'Where you are', 'Onde você está')]}
          />
          <Leader
            points={[
              [144, 130],
              [176, 122],
            ]}
          />
          <Label
            x={342}
            y={128}
            weight={600}
            lines={[t('Si te trasladas', 'If you move', 'Se vai se deslocar')]}
          />
          <Leader
            points={[
              [338, 124],
              [292, 145],
            ]}
          />
          <Label
            x={342}
            y={168}
            weight={600}
            lines={[t('Próximo contacto', 'Next contact', 'Próximo contato')]}
          />
          <Leader
            points={[
              [338, 164],
              [300, 162],
            ]}
          />
          <Label
            x={342}
            y={208}
            weight={600}
            lines={[t('Hora de envío', 'Time sent', 'Hora do envio')]}
          />
          <Leader
            points={[
              [338, 204],
              [312, 192],
            ]}
          />
          <Label x={16} y={236} weight={700} lines={[t('Usa SMS', 'Use SMS', 'Use SMS')]} />
          <Label
            x={16}
            y={256}
            size={13}
            lines={[
              t('Las llamadas, solo', 'Keep calls for', 'Ligações, só'),
              t('para emergencias', 'emergencies', 'para emergências'),
            ]}
          />
          <Label
            x={342}
            y={246}
            size={13}
            color={LINE}
            lines={[
              t('Faro lo prepara;', 'Faro drafts it;', 'O Faro prepara;'),
              t('tú decides enviarlo', 'you choose to send', 'você decide enviar'),
            ]}
          />
        </>
      ),
    };
  },

  hotel: ({ t, ref }) => {
    const top = [301, 303, 305, 307, 309, 311],
      bottom = [302, 304, 306, 0, 308, 310];
    return {
      label: t(
        'Plano de ejemplo de un piso de hotel: tu habitación, la ruta más corta a la escalera de salida, una salida alternativa y el ascensor, que no debes usar.',
        'Example hotel floor plan: your room, the shortest route to the exit stairs, an alternative exit and the elevator, which you should not use.',
        'Planta de exemplo de um andar de hotel: seu quarto, a rota mais curta até a escada de saída, uma saída alternativa e o elevador, que você não deve usar.',
      ),
      body: (
        <>
          <rect x={60} y={86} width={360} height={40} fill="#f1f5f2" />
          <rect x={60} y={16} width={360} height={180} fill="none" stroke={INK} strokeWidth={4} />
          <path
            d="M60 86 H420 M60 126 H420 M120 16 V86 M180 16 V86 M240 16 V86 M300 16 V86 M360 16 V86 M120 126 V196 M180 126 V196 M240 126 V196 M300 126 V196 M360 126 V196"
            stroke={INK}
            strokeWidth={2.2}
          />
          {[90, 150, 210, 270, 330, 390].map((x) => (
            <g key={x}>
              <rect x={x - 8} y={84} width={16} height={4} fill="#f1f5f2" />
              <rect x={x - 8} y={124} width={16} height={4} fill="#f1f5f2" />
            </g>
          ))}
          {top.map((n, i) => (
            <Label
              key={n}
              x={90 + i * 60}
              y={46}
              anchor="middle"
              size={12}
              color={LINE}
              halo={false}
              lines={[String(n)]}
            />
          ))}
          {bottom.map((n, i) =>
            n ? (
              <Label
                key={n}
                x={90 + i * 60}
                y={170}
                anchor="middle"
                size={12}
                color={LINE}
                halo={false}
                lines={[String(n)]}
              />
            ) : (
              <g key="lift">
                <rect
                  x={252}
                  y={138}
                  width={36}
                  height={46}
                  fill="none"
                  stroke={INK}
                  strokeWidth={1.4}
                />
                <path d="M252 138 L288 184 M288 138 L252 184" stroke={DANGER} strokeWidth={1.6} />
              </g>
            ),
          )}
          {[14, 420].map((x) => (
            <g key={x}>
              <rect
                x={x}
                y={70}
                width={46}
                height={72}
                fill="#fff"
                stroke={INK}
                strokeWidth={2.2}
              />
              {[78, 88, 98, 108, 118, 128].map((y) => (
                <path key={y} d={`M${x + 4} ${y} H${x + 42}`} stroke={LINE} strokeWidth={1} />
              ))}
              <rect x={x + 2} y={48} width={42} height={17} rx={3} fill={SAFE} />
              <Label
                x={x + 23}
                y={60.5}
                anchor="middle"
                size={11}
                weight={700}
                color="#fff"
                halo={false}
                lines={[t('Salida', 'Exit', 'Saída')]}
              />
            </g>
          ))}
          <path
            d="M330 74 V106 H446"
            fill="none"
            stroke={SAFE}
            strokeWidth={3}
            strokeDasharray="8 5"
            markerEnd={ref('arrow-safe')}
          />
          <path
            d="M318 106 H40"
            fill="none"
            stroke={SAFE}
            strokeWidth={2}
            strokeDasharray="3 5"
            opacity={0.6}
            markerEnd={ref('arrow-safe')}
          />
          <circle cx={330} cy={56} r={9} fill={DANGER} stroke="#fff" strokeWidth={3} />
          <g transform="translate(0 0)">
            <circle cx={30} cy={232} r={7} fill={DANGER} />
            <Label
              x={46}
              y={237}
              size={13}
              lines={[t('Estás aquí', 'You are here', 'Você está aqui')]}
            />
            <path d="M22 258 H40" stroke={SAFE} strokeWidth={3} strokeDasharray="6 4" />
            <Label
              x={46}
              y={263}
              size={13}
              lines={[
                t(
                  'Ruta más corta a la salida',
                  'Shortest route to the exit',
                  'Rota mais curta até a saída',
                ),
              ]}
            />
            <path
              d="M22 284 H40"
              stroke={SAFE}
              strokeWidth={2}
              strokeDasharray="3 4"
              opacity={0.6}
            />
            <Label
              x={46}
              y={289}
              size={13}
              lines={[t('Salida alternativa', 'Alternative exit', 'Saída alternativa')]}
            />
            <rect x={250} y={225} width={24} height={14} rx={3} fill={SAFE} />
            <Label
              x={284}
              y={237}
              size={13}
              lines={[t('Escalera de salida', 'Exit stairs', 'Escada de saída')]}
            />
            <path d="M254 250 L270 268 M270 250 L254 268" stroke={DANGER} strokeWidth={1.6} />
            <rect
              x={254}
              y={250}
              width={16}
              height={18}
              fill="none"
              stroke={INK}
              strokeWidth={1.2}
            />
            <Label
              x={284}
              y={263}
              size={13}
              lines={[t('Ascensor: no lo uses', 'Elevator: do not use', 'Elevador: não use')]}
            />
            <Label
              x={250}
              y={289}
              size={12.5}
              color={LINE}
              lines={[
                t(
                  'Plano de ejemplo: pide el tuyo',
                  'Example plan: ask for yours',
                  'Planta de exemplo: peça a sua',
                ),
              ]}
            />
          </g>
        </>
      ),
    };
  },

  exit: ({ t, ref }) => ({
    label: t(
      'Después del sismo. No entres en edificios dañados, aléjate de la zona de caída de fachadas y de los cables caídos, y espera en un espacio abierto.',
      'After the earthquake. Stay out of damaged buildings, keep away from where facades can fall and from fallen power lines, and wait in an open space.',
      'Depois do terremoto. Não entre em prédios danificados, afaste-se da zona de queda de fachadas e dos fios elétricos caídos e espere em um espaço aberto.',
    ),
    body: (
      <>
        <path
          d="M170 46 L252 236 H170 Z"
          fill={ref('danger')}
          stroke={DANGER}
          strokeWidth={1.2}
          strokeDasharray="4 3"
        />
        <rect x={30} y={46} width={140} height={190} fill="#fff" stroke={INK} strokeWidth={2} />
        <path d="M30 109 H170 M30 172 H170" stroke={LINE} strokeWidth={1.2} />
        {[66, 129].map((y) =>
          [50, 90, 130].map((x) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={20}
              height={24}
              fill={WATER_WASH}
              stroke={INK}
              strokeWidth={1.2}
            />
          )),
        )}
        <rect
          x={50}
          y={192}
          width={20}
          height={24}
          fill={WATER_WASH}
          stroke={INK}
          strokeWidth={1.2}
        />
        <rect
          x={130}
          y={192}
          width={20}
          height={24}
          fill={WATER_WASH}
          stroke={INK}
          strokeWidth={1.2}
        />
        <rect x={88} y={194} width={24} height={42} fill="#fff" stroke={INK} strokeWidth={1.2} />
        <path
          d="M74 46 L84 70 L76 92 L90 116 L82 140"
          fill="none"
          stroke={DANGER}
          strokeWidth={2}
        />
        <path d="M158 110 L148 128 L156 146" fill="none" stroke={DANGER} strokeWidth={2} />
        <path d="M178 236 l6 -8 l7 8 Z M196 236 l4 -6 l6 6 Z M214 236 l3 -5 l5 5 Z" fill={LINE} />
        <rect x={0} y={236} width={480} height={64} fill={ref('ground')} />
        <path d="M0 236 H480" stroke={INK} strokeWidth={1.6} />
        <rect x={372} y={236} width={100} height={8} fill={SAFE_WASH} />
        <path d="M290 236 V100 M276 108 H304" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d="M304 108 Q326 150 338 234" fill="none" stroke={DANGER} strokeWidth={2} />
        <circle
          cx={338}
          cy={234}
          r={13}
          fill="none"
          stroke={DANGER}
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />
        <Person x={422} y={236} s={1.05} />
        <Label
          x={16}
          y={30}
          weight={700}
          color={DANGER}
          lines={[
            t(
              'Edificio dañado: no entres',
              'Damaged building: stay out',
              'Prédio danificado: não entre',
            ),
          ]}
        />
        <Leader
          points={[
            [64, 38],
            [78, 58],
          ]}
        />
        <Label
          x={470}
          y={34}
          anchor="end"
          weight={700}
          color={SAFE}
          lines={[t('Espacio abierto', 'Open space', 'Espaço aberto')]}
        />
        <Label
          x={470}
          y={52}
          anchor="end"
          size={13}
          lines={[
            t(
              'lejos de edificios y cables',
              'away from buildings and lines',
              'longe de prédios e fios',
            ),
          ]}
        />
        <Leader
          points={[
            [440, 60],
            [424, 166],
          ]}
        />
        <Label
          x={206}
          y={262}
          anchor="middle"
          size={13}
          weight={600}
          color={DANGER}
          lines={[t('Zona de caída', 'Fall zone', 'Zona de queda')]}
        />
        <Label
          x={338}
          y={262}
          anchor="middle"
          size={13}
          weight={600}
          color={DANGER}
          lines={[t('Cable caído', 'Fallen line', 'Fio caído')]}
        />
        <Label
          x={16}
          y={288}
          size={12.5}
          lines={[
            t(
              'Si vuelve a temblar: agáchate, cúbrete y sujétate.',
              'If shaking returns: drop, cover and hold on.',
              'Se tremer de novo: abaixe-se, proteja-se e segure-se.',
            ),
          ]}
        />
      </>
    ),
  }),

  bag: ({ t }) => {
    const cell = (n: number): Pt => [30 + (n % 4) * 60, 30 + Math.floor(n / 4) * 60];
    const icons: ReactNode[] = [
      <g key="water">
        <rect x={-5} y={-19} width={10} height={5} rx={1} />
        <path d="M-8 -13 H8 V15 Q8 18 5 18 H-5 Q-8 18 -8 15 Z" />
        <path d="M-7 0 H7 V15 Q7 17 5 17 H-5 Q-7 17 -7 15 Z" fill={WATER_WASH} stroke="none" />
      </g>,
      <g key="food">
        <ellipse cx={0} cy={-11} rx={12} ry={4} />
        <path d="M-12 -11 V12 Q0 18 12 12 V-11" />
        <path d="M-12 -2 Q0 3 12 -2 M-12 5 Q0 10 12 5" />
      </g>,
      <g key="medicine">
        <rect x={-10} y={-18} width={20} height={7} rx={1.5} />
        <rect x={-8} y={-11} width={16} height={28} rx={2} />
        <path d="M-4 3 H4 M0 -1 V7" stroke={DANGER} />
      </g>,
      <g key="firstaid">
        <rect x={-15} y={-10} width={30} height={24} rx={3} />
        <path d="M-5 -10 V-14 H5 V-10" />
        <path
          d="M-2.5 -4 H2.5 V-0.5 H6 V4.5 H2.5 V8 H-2.5 V4.5 H-6 V-0.5 H-2.5 Z"
          fill={DANGER}
          stroke="none"
        />
      </g>,
      <g key="light">
        <rect x={-16} y={-5} width={20} height={10} rx={2} />
        <path d="M4 -7 H10 L14 -10 V10 L10 7 H4 Z" />
        <path d="M17 -8 L22 -12 M18 0 H24 M17 8 L22 12" />
      </g>,
      <g key="radio">
        <rect x={-16} y={-8} width={32} height={22} rx={3} />
        <circle cx={-6} cy={3} r={5} />
        <path d="M5 -1 H11 M5 4 H11" />
        <path d="M10 -8 L16 -19" />
      </g>,
      <g key="power">
        <rect x={-9} y={-16} width={18} height={30} rx={3} />
        <path d="M2 -9 L-3 1 H2 L-2 9" />
        <path d="M0 14 V18 Q0 21 4 21 H14" />
      </g>,
      <g key="whistle">
        <path d="M-14 -4 H8 Q16 -4 16 4 Q16 12 8 12 Q2 12 0 6 H-14 Z" />
        <circle cx={8} cy={4} r={3} />
        <path d="M-14 -4 V-8 H-6 V-4" />
      </g>,
      <g key="documents">
        <rect x={-11} y={-15} width={22} height={30} rx={2} />
        <circle cx={0} cy={-3} r={5} />
        <path d="M-6 8 H6" />
        <path d="M-15 -19 H15 V19 H-15 Z" strokeDasharray="3 2" stroke={WATER} />
      </g>,
      <g key="cash">
        <rect x={-17} y={-9} width={34} height={18} rx={2} />
        <circle cx={0} cy={0} r={4.5} />
        <path d="M-13 -5 V5 M13 -5 V5" />
      </g>,
      <g key="clothes">
        <path d="M-6 -15 L-16 -9 L-12 0 L-8 -2 V16 H8 V-2 L12 0 L16 -9 L6 -15 Q0 -10 -6 -15 Z" />
      </g>,
      <g key="mask">
        <path d="M-14 -4 Q0 -14 14 -4 L12 8 Q0 16 -12 8 Z" />
        <path d="M-14 -2 L-20 -8 M14 -2 L20 -8 M-12 6 L-19 8 M12 6 L19 8" />
        <path d="M-6 0 H6" />
      </g>,
    ];
    return {
      label: t(
        'Contenido de una mochila de emergencia: agua, comida, medicamentos, botiquín, linterna, radio, batería externa, silbato, documentos, efectivo, ropa y mascarilla.',
        'Emergency bag contents: water, food, medication, first-aid kit, flashlight, radio, power bank, whistle, documents, cash, clothes and mask.',
        'Conteúdo de uma mochila de emergência: água, comida, medicamentos, kit de primeiros socorros, lanterna, rádio, carregador portátil, apito, documentos, dinheiro em espécie, roupas e máscara.',
      ),
      body: (
        <g fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {icons.map((icon, n) => {
            const [x, y] = cell(n);
            return (
              <g key={n} transform={`translate(${x} ${y})`}>
                {icon}
              </g>
            );
          })}
        </g>
      ),
    };
  },
};

export default function SafetyIllustration({ scene, lang }: { scene: SafetyScene; lang: Lang }) {
  const id = 'fw' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const { label, body } = drawings[scene]({ t, ref: (name) => `url(#${id}-${name})` });
  const compact = scene === 'bag';
  const arrow = (name: string, color: string) => (
    <marker
      id={`${id}-arrow-${name}`}
      viewBox="0 0 10 10"
      refX="7"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <path d="M0 0 L10 5 L0 10 Z" fill={color} />
    </marker>
  );
  return (
    <svg
      className="fw-safety-illustration"
      data-scene={scene}
      viewBox={compact ? '0 0 240 180' : '0 0 480 300'}
      role="img"
      aria-label={label}
      focusable="false"
    >
      <defs>
        <pattern
          id={`${id}-ground`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="7" height="7" fill="#eef2ef" />
          <path d="M0 0 V7" stroke="#cdd8d1" strokeWidth="1.2" />
        </pattern>
        <pattern
          id={`${id}-danger`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="7" height="7" fill="#fbefe6" />
          <path d="M0 0 V7" stroke="#e2ae8b" strokeWidth="1.4" />
        </pattern>
        {arrow('safe', SAFE)}
        {arrow('ink', INK)}
        {arrow('water', WATER)}
      </defs>
      <rect width={compact ? 240 : 480} height={compact ? 180 : 300} fill="#fff" />
      {body}
    </svg>
  );
}
