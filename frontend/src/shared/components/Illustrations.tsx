import { INK_COLORS } from '../data/types'
import type { BuiltinDeviceKind, DeviceKind, InkColor, InkColorItem } from '../data/types'

/*
 * رسومات توضيحية مسطحة مرسومة كـ SVG داخل الكود بألوان هوية Kinetic Amber.
 * النصوص ثابتة ومن كتابتنا، لذلك عرضها عبر innerHTML آمن.
 */

const DROP = 'M0 0 C6 9 11 15 11 21 A11 11 0 0 1 -11 21 C-11 15 -6 9 0 0 Z'
const BLOB =
  'M24 84 C20 44 62 18 104 20 C150 22 182 48 178 88 C174 126 140 138 100 136 C58 134 28 120 24 84 Z'

/** مكتب عليه شاشة وكيس وهاتف مكتبي. */
const devicesHero = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220">
  <path d="M38 120 C30 60 90 22 160 26 C240 30 300 62 292 122 C284 182 220 200 158 198 C92 196 46 176 38 120 Z" fill="#FEF3C7"/>
  <circle cx="270" cy="48" r="6" fill="#FCC41A"/>
  <circle cx="54" cy="58" r="4" fill="#4059AA" opacity="0.45"/>
  <path d="M286 78 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FCC41A"/>
  <path d="M30 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#4059AA" opacity="0.6"/>
  <ellipse cx="160" cy="198" rx="128" ry="7" fill="#0F172A" opacity="0.08"/>
  <rect x="26" y="160" width="268" height="10" rx="3" fill="#334155"/>
  <rect x="40" y="170" width="8" height="24" rx="2" fill="#475569"/>
  <rect x="272" y="170" width="8" height="24" rx="2" fill="#475569"/>
  <rect x="40" y="82" width="46" height="78" rx="6" fill="#1E293B"/>
  <rect x="46" y="90" width="34" height="7" rx="2" fill="#334155"/>
  <rect x="46" y="101" width="34" height="7" rx="2" fill="#334155"/>
  <rect x="78" y="88" width="3" height="66" rx="1.5" fill="#334155"/>
  <circle cx="63" cy="138" r="6" fill="none" stroke="#FCC41A" stroke-width="2.5"/>
  <rect x="62" y="130" width="2" height="6" rx="1" fill="#FCC41A"/>
  <circle cx="52" cy="152" r="2" fill="#10B981"/>
  <rect x="150" y="138" width="22" height="16" fill="#475569"/>
  <rect x="132" y="153" width="58" height="7" rx="3" fill="#334155"/>
  <rect x="96" y="50" width="130" height="90" rx="9" fill="#0F172A"/>
  <rect x="104" y="58" width="114" height="72" rx="4" fill="#4059AA"/>
  <rect x="114" y="68" width="40" height="6" rx="3" fill="#DCE1FF"/>
  <rect x="114" y="80" width="26" height="4" rx="2" fill="#B6C4FF"/>
  <rect x="170" y="98" width="10" height="24" rx="2" fill="#FCC41A"/>
  <rect x="184" y="86" width="10" height="36" rx="2" fill="#FFDF97"/>
  <rect x="198" y="104" width="10" height="18" rx="2" fill="#FCC41A"/>
  <path d="M114 120 L128 106 L140 113 L156 96" stroke="#DCE1FF" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M238 132 H288 L296 160 H230 Z" fill="#334155"/>
  <rect x="228" y="120" width="38" height="12" rx="6" fill="#1E293B"/>
  <path d="M232 128 C222 136 224 150 230 156" stroke="#1E293B" stroke-width="2" fill="none"/>
  <rect x="266" y="138" width="22" height="13" rx="2" fill="#DCE1FF"/>
  <rect x="269" y="142" width="12" height="2.5" rx="1.25" fill="#4059AA"/>
  <rect x="240" y="139" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="248" y="139" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="256" y="139" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="239" y="146" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="247" y="146" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="255" y="146" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="238" y="153" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="246" y="153" width="5" height="4" rx="1" fill="#94A3B8"/>
  <rect x="254" y="153" width="5" height="4" rx="1" fill="#FCC41A"/>
  <rect x="104" y="146" width="14" height="14" rx="3" fill="#FCC41A"/>
  <path d="M118 149 a4 4 0 0 1 0 8" stroke="#FCC41A" stroke-width="2.5" fill="none"/>
</svg>`

const cartridgeBody = (label: string) => `
  <ellipse cx="100" cy="128" rx="62" ry="6" fill="#0F172A" opacity="0.10"/>
  <path d="M44 70 L132 52 L160 64 L72 82 Z" fill="#64748B"/>
  <path d="M44 70 L72 82 L72 120 L44 108 Z" fill="#1E293B"/>
  <path d="M72 82 L160 64 L160 102 L72 120 Z" fill="#334155"/>
  ${label}
  <path d="M90 64 L118 58 L124 61 L96 67 Z" fill="#94A3B8"/>
  <ellipse cx="58" cy="95" rx="6" ry="8" fill="#0F172A"/>
  <path d="M150 70 L156 69 L156 96 L150 97 Z" fill="#475569"/>`

/** خرطوشة حبر بلون محدد مع قطرة حبر. */
function cartridge(color: InkColor | InkColorItem) {
  const meta =
    typeof color === 'string'
      ? (INK_COLORS[color] ?? { primary: '#64748b', light: '#f1f5f9' })
      : color
  const { primary: c, light } = meta
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
  <path d="${BLOB}" fill="${light}"/>
  <circle cx="38" cy="42" r="4" fill="${c}" opacity="0.5"/>
  <circle cx="180" cy="62" r="3" fill="${c}" opacity="0.4"/>
  ${cartridgeBody(`
  <path d="M88 84 L142 73 L142 95 L88 106 Z" fill="${c}" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
  <path d="M90 86 L140 75.5 L140 79 L90 89.5 Z" fill="#FFFFFF" opacity="0.3"/>`)}
  <path transform="translate(156 18)" d="${DROP}" fill="${c}"/>
  <ellipse cx="151" cy="41" rx="2.5" ry="4" fill="#FFFFFF" opacity="0.5"/>
</svg>`
}

/** خرطوشة بملصق رباعي الألوان مع قطرات CMYK. */
function inkHero() {
  const q = (color: InkColor, x0: number, y0: number, x1: number, y1: number) =>
    `<path d="M${x0} ${y0} L${x1} ${y1} L${x1} ${y1 + 22} L${x0} ${y0 + 22} Z" fill="${INK_COLORS[color].primary}"/>`
  const drop = (color: InkColor, x: number, y: number, s: number) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="${DROP}" fill="${INK_COLORS[color].primary}"/>`
  const label = [
    q('cyan', 88, 84, 101.5, 81.25),
    q('magenta', 101.5, 81.25, 115, 78.5),
    q('yellow', 115, 78.5, 128.5, 75.75),
    q('black', 128.5, 75.75, 142, 73),
    '<path d="M88 84 L142 73 L142 95 L88 106 Z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>',
  ].join('\n')
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
  <path d="${BLOB}" fill="#FEF3C7"/>
  ${cartridgeBody(label)}
  ${drop('cyan', 40, 22, 0.8)}
  ${drop('magenta', 150, 14, 1)}
  ${drop('yellow', 176, 44, 0.7)}
  ${drop('black', 70, 28, 0.6)}
</svg>`
}

const DEVICE_BODIES: Record<BuiltinDeviceKind, string> = {
  monitor: `
  <rect x="28" y="18" width="64" height="44" rx="5" fill="#0F172A"/>
  <rect x="33" y="23" width="54" height="34" rx="2" fill="#4059AA"/>
  <path d="M40 48 L50 40 L58 45 L72 33" stroke="#FCC41A" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="54" y="62" width="12" height="8" fill="#475569"/>
  <rect x="42" y="69" width="36" height="5" rx="2.5" fill="#334155"/>`,
  pcCase: `
  <rect x="42" y="10" width="36" height="66" rx="5" fill="#1E293B"/>
  <rect x="47" y="17" width="26" height="6" rx="2" fill="#334155"/>
  <rect x="47" y="27" width="26" height="6" rx="2" fill="#334155"/>
  <rect x="72" y="16" width="2.5" height="52" rx="1.25" fill="#334155"/>
  <circle cx="60" cy="56" r="5.5" fill="none" stroke="#FCC41A" stroke-width="2.5"/>
  <rect x="59" y="48.5" width="2" height="6" rx="1" fill="#FCC41A"/>
  <circle cx="50" cy="69" r="1.8" fill="#10B981"/>
  <rect x="46" y="76" width="6" height="3" rx="1" fill="#475569"/>
  <rect x="68" y="76" width="6" height="3" rx="1" fill="#475569"/>`,
  phone: `
  <path d="M26 38 H94 L102 70 H18 Z" fill="#334155"/>
  <rect x="18" y="70" width="84" height="4" rx="2" fill="#1E293B"/>
  <rect x="16" y="24" width="42" height="13" rx="6.5" fill="#1E293B"/>
  <path d="M20 33 C10 42 12 56 20 64" stroke="#1E293B" stroke-width="2" fill="none"/>
  <rect x="62" y="44" width="32" height="17" rx="2" fill="#4059AA"/>
  <rect x="66" y="49" width="16" height="3" rx="1.5" fill="#FCC41A"/>
  <rect x="66" y="55" width="22" height="2.5" rx="1.25" fill="#DCE1FF"/>
  <rect x="30" y="44" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="40" y="44" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="50" y="44" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="29" y="52" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="39" y="52" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="49" y="52" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="28" y="60" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="38" y="60" width="7" height="5" rx="1" fill="#94A3B8"/>
  <rect x="48" y="60" width="7" height="5" rx="1" fill="#FCC41A"/>`,
  printer: `
  <rect x="34" y="14" width="52" height="18" rx="3" fill="#CBD5E1"/>
  <rect x="40" y="18" width="40" height="3" rx="1.5" fill="#94A3B8"/>
  <rect x="22" y="30" width="76" height="34" rx="6" fill="#1E293B"/>
  <rect x="28" y="36" width="64" height="10" rx="2" fill="#334155"/>
  <circle cx="82" cy="41" r="2.2" fill="#10B981"/>
  <circle cx="74" cy="41" r="2.2" fill="#FCC41A"/>
  <rect x="34" y="54" width="52" height="18" rx="2" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
  <rect x="42" y="59" width="28" height="3" rx="1.5" fill="#4059AA"/>
  <rect x="42" y="65" width="36" height="3" rx="1.5" fill="#CBD5E1"/>`,
  other: `
  <rect x="30" y="24" width="60" height="38" rx="4" fill="#1E293B"/>
  <rect x="35" y="29" width="50" height="28" rx="2" fill="#4059AA"/>
  <rect x="40" y="35" width="20" height="4" rx="2" fill="#FCC41A"/>
  <rect x="40" y="43" width="30" height="3" rx="1.5" fill="#DCE1FF"/>
  <rect x="40" y="49" width="22" height="3" rx="1.5" fill="#B6C4FF"/>
  <path d="M22 62 H98 L93 70 H27 Z" fill="#64748B"/>`,
}

/** رسمة صغيرة لكل نوع جهاز. */
function device(kind: DeviceKind) {
  const body = (kind in DEVICE_BODIES ? DEVICE_BODIES[kind as BuiltinDeviceKind] : DEVICE_BODIES.other)
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
  <ellipse cx="60" cy="48" rx="50" ry="40" fill="#EFF4FF"/>
  <ellipse cx="60" cy="80" rx="36" ry="4" fill="#0F172A" opacity="0.08"/>
  ${body}
</svg>`
}

/** بطاقة اشتراكات وتراخيص مع تقويم وختم. */
const subscriptionsHero = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">
  <path d="M26 88 C20 44 68 18 122 20 C180 22 220 48 214 90 C208 132 164 146 118 144 C70 142 32 126 26 88 Z" fill="#EFF4FF"/>
  <ellipse cx="120" cy="140" rx="76" ry="6" fill="#0F172A" opacity="0.08"/>
  <rect x="46" y="34" width="128" height="92" rx="10" fill="#1E293B"/>
  <rect x="46" y="34" width="128" height="24" rx="10" fill="#0F172A"/>
  <rect x="46" y="48" width="128" height="10" fill="#0F172A"/>
  <circle cx="64" cy="46" r="4" fill="#FCC41A"/>
  <rect x="76" y="43" width="54" height="6" rx="3" fill="#475569"/>
  <rect x="60" y="70" width="64" height="8" rx="4" fill="#DCE1FF"/>
  <rect x="60" y="86" width="44" height="6" rx="3" fill="#94A3B8"/>
  <rect x="60" y="100" width="78" height="6" rx="3" fill="#64748B"/>
  <circle cx="170" cy="102" r="24" fill="#FCC41A"/>
  <circle cx="170" cy="102" r="18" fill="#FEF3C7"/>
  <path d="M161 102 L167 108 L180 95" stroke="#0F172A" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

export const Illustrations = { devicesHero, cartridge, inkHero, subscriptionsHero, device }

export function Illustration({
  svg,
  label,
  className,
}: {
  svg: string
  label: string
  className?: string
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`illustration block ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
