import { Building2, MapPin } from 'lucide-react'
import { DEVICE_LOCATIONS } from '../../../shared/data/types'
import type { DeviceLocation } from '../../../shared/data/types'

const DEFAULT_TOWER_FLOORS = 24

function parseFloorNumber(raw?: string): number | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null
  if (trimmed === '0' || trimmed === 'g' || trimmed.includes('أرضي') || trimmed.includes('ارضي')) {
    return 0
  }
  const match = trimmed.match(/\d+/)
  if (!match) return null
  const num = Number.parseInt(match[0], 10)
  return Number.isFinite(num) ? num : null
}

export function DeviceLocationTower({
  location = 'town',
  floor,
  officeNumber,
}: {
  location?: DeviceLocation
  floor?: string
  officeNumber?: string
}) {
  const activeFloor = parseFloorNumber(floor)
  const isField = location === 'field'
  const totalFloors = Math.max(DEFAULT_TOWER_FLOORS, activeFloor && activeFloor > 0 ? activeFloor : DEFAULT_TOWER_FLOORS)

  // SVG geometry for the 24-story tower
  const floorHeight = 9
  const floorGap = 2
  const step = floorHeight + floorGap
  const roofY = 28
  const towerLeft = 64
  const towerWidth = 104
  const firstFloorTop = roofY + 14
  const groundTop = firstFloorTop + totalFloors * step + 2
  const groundHeight = 16
  const svgHeight = groundTop + groundHeight + 16

  const rulerMarks = new Set([totalFloors, 20, 15, 10, 5, 1])

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-inner">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
          {isField ? (
            <MapPin className="size-4 text-signal" />
          ) : (
            <Building2 className="size-4 text-signal" />
          )}
          <span>{DEVICE_LOCATIONS[location].label}</span>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-slate-300 ring-1 ring-slate-800">
          {isField ? 'موقع ميداني' : `${totalFloors} دور`}
        </span>
      </div>

      {isField ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <svg
            viewBox="0 0 220 200"
            className="w-full max-w-[210px]"
            role="img"
            aria-label="رسم توضيحي لموقع الجهاز في الحقل"
          >
            <defs>
              <radialGradient id="field-glow" cx="50%" cy="55%" r="50%">
                <stop offset="0%" stopColor="#fcc41a" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#fcc41a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="162" width="220" height="2" fill="#334155" rx="1" />
            <circle cx="110" cy="118" r="68" fill="url(#field-glow)" />
            {/* Comms Mast */}
            <line x1="158" y1="42" x2="150" y2="162" stroke="#475569" strokeWidth="2.5" />
            <line x1="158" y1="42" x2="166" y2="162" stroke="#475569" strokeWidth="2.5" />
            <line x1="153" y1="80" x2="163" y2="80" stroke="#475569" strokeWidth="1.5" />
            <line x1="151" y1="120" x2="165" y2="120" stroke="#475569" strokeWidth="1.5" />
            <circle cx="158" cy="38" r="4" fill="#fcc41a" />
            {/* Field Cabin */}
            <rect x="44" y="102" width="92" height="60" rx="6" fill="#1e293b" stroke="#fcc41a" strokeWidth="2" />
            <rect x="56" y="116" width="24" height="18" rx="2" fill="#fcc41a" />
            <rect x="92" y="116" width="24" height="18" rx="2" fill="#fcc41a" />
            <rect x="74" y="140" width="22" height="22" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
          </svg>
          <p className="mt-2 text-center text-xs font-semibold text-signal">
            الجهاز متواجد في موقع الحقل
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg
            viewBox={`0 0 220 ${svgHeight}`}
            className="w-full max-w-[220px]"
            role="img"
            aria-label={
              activeFloor !== null
                ? `برج من ${totalFloors} دور، يضيء عند الدور ${activeFloor === 0 ? 'الأرضي' : activeFloor}`
                : `برج من ${totalFloors} دور`
            }
          >
            <defs>
              <filter id="floor-amber-glow" x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Spire & Crown */}
            <line
              x1={towerLeft + towerWidth / 2}
              y1="6"
              x2={towerLeft + towerWidth / 2}
              y2={roofY - 6}
              stroke="#64748b"
              strokeWidth="2"
            />
            <circle cx={towerLeft + towerWidth / 2} cy="6" r="2.5" fill="#fcc41a" opacity="0.85" />
            <rect
              x={towerLeft + 18}
              y={roofY - 6}
              width={towerWidth - 36}
              height="8"
              rx="2"
              fill="#334155"
            />
            <rect x={towerLeft} y={roofY + 2} width={towerWidth} height="10" rx="2" fill="#1e293b" />

            {/* Floors 24 down to 1 */}
            {Array.from({ length: totalFloors }, (_, idx) => {
              const floorNum = totalFloors - idx
              const y = firstFloorTop + idx * step
              const isLit = activeFloor === floorNum
              const showMark = isLit || rulerMarks.has(floorNum)

              return (
                <g key={floorNum}>
                  {isLit && (
                    <rect
                      x={towerLeft - 5}
                      y={y - 2}
                      width={towerWidth + 10}
                      height={floorHeight + 4}
                      rx="3"
                      fill="#fcc41a"
                      opacity="0.3"
                      filter="url(#floor-amber-glow)"
                    />
                  )}
                  <rect
                    x={towerLeft}
                    y={y}
                    width={towerWidth}
                    height={floorHeight}
                    rx="1.5"
                    fill={isLit ? '#fcc41a' : '#1e293b'}
                    stroke={isLit ? '#fef08a' : '#334155'}
                    strokeWidth={isLit ? '0.9' : '0.5'}
                  />
                  {/* Subtle window segments */}
                  {[0, 1, 2, 3, 4].map((w) => (
                    <rect
                      key={w}
                      x={towerLeft + 8 + w * 19}
                      y={y + 2}
                      width="12"
                      height={floorHeight - 4}
                      rx="0.8"
                      fill={isLit ? '#fffbeb' : '#334155'}
                      opacity={isLit ? 0.95 : 0.65}
                    />
                  ))}
                  {showMark && (
                    <text
                      x={towerLeft - 8}
                      y={y + floorHeight - 1.5}
                      textAnchor="end"
                      fontSize={isLit ? '9.5' : '7.5'}
                      fontWeight={isLit ? '800' : '500'}
                      fill={isLit ? '#fcc41a' : '#64748b'}
                      fontFamily="monospace"
                    >
                      {floorNum}
                    </text>
                  )}
                  {isLit && (
                    <g>
                      <line
                        x1={towerLeft + towerWidth + 4}
                        y1={y + floorHeight / 2}
                        x2={towerLeft + towerWidth + 16}
                        y2={y + floorHeight / 2}
                        stroke="#fcc41a"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={towerLeft + towerWidth + 18}
                        cy={y + floorHeight / 2}
                        r="3"
                        fill="#fcc41a"
                      />
                    </g>
                  )}
                </g>
              )
            })}

            {/* Ground / Lobby Floor */}
            {activeFloor === 0 && (
              <rect
                x={towerLeft - 7}
                y={groundTop - 2}
                width={towerWidth + 14}
                height={groundHeight + 4}
                rx="3"
                fill="#fcc41a"
                opacity="0.32"
                filter="url(#floor-amber-glow)"
              />
            )}
            <rect
              x={towerLeft - 3}
              y={groundTop}
              width={towerWidth + 6}
              height={groundHeight}
              rx="2"
              fill={activeFloor === 0 ? '#fcc41a' : '#0f172a'}
              stroke={activeFloor === 0 ? '#fef08a' : '#475569'}
              strokeWidth="1"
            />
            <rect
              x={towerLeft + towerWidth / 2 - 12}
              y={groundTop + 4}
              width="24"
              height={groundHeight - 4}
              rx="1.5"
              fill={activeFloor === 0 ? '#fffbeb' : '#1e293b'}
            />

            {/* Base line */}
            <line
              x1="28"
              y1={groundTop + groundHeight + 1}
              x2="196"
              y2={groundTop + groundHeight + 1}
              stroke="#475569"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-center text-xs">
        <div className="">
          <span className="block text-[10px] text-slate-400">الدور</span>
          <span className="mt-0.5 block font-bold text-signal">
            {floor?.trim() ? (activeFloor === 0 ? 'الأرضي' : floor.trim()) : 'غير محدد'}
          </span>
        </div>
        <div className="">
          <span className="block text-[10px] text-slate-400">المكتب</span>
          <span className="mt-0.5 block font-bold text-slate-100 tabular-nums">
            {officeNumber?.trim() || 'غير محدد'}
          </span>
        </div>
      </div>
    </div>
  )
}
