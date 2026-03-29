import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'
import { useSiteLanguage } from '@/i18n/siteLanguage'

// Fake telemetry data that animates
function useTelemetry() {
  const { energyPercent, launchPhase } = useGameStore()
  const [data, setData] = useState({
    thrust: 0,
    fuel: 100,
    altitude: 0,
    velocity: 0,
    temp: 22,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const isLaunching = launchPhase === 'ignition' || launchPhase === 'launched'
      setData((prev) => ({
        thrust: isLaunching
          ? Math.min(100, prev.thrust + Math.random() * 5)
          : energyPercent * 0.6 + Math.random() * 5,
        fuel: isLaunching
          ? Math.max(0, prev.fuel - Math.random() * 0.8)
          : 100 - energyPercent * 0.3,
        altitude: isLaunching
          ? prev.altitude + Math.random() * 120
          : Math.random() * 10,
        velocity: isLaunching
          ? Math.min(9800, prev.velocity + Math.random() * 200)
          : Math.random() * 30,
        temp: isLaunching
          ? Math.min(3200, prev.temp + Math.random() * 80)
          : 20 + energyPercent * 0.5 + Math.random() * 10,
      }))
    }, 200)
    return () => clearInterval(interval)
  }, [energyPercent, launchPhase])

  return data
}

function TelemetryRow({
  label,
  value,
  unit,
  color = '#00D4FF',
  warning = false,
}: {
  label: string
  value: string
  unit: string
  color?: string
  warning?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[rgba(0,212,255,0.06)]">
      <span className="font-mono text-[10px] text-metal-light opacity-40 tracking-wider uppercase">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className="font-mono text-sm font-bold"
          style={{
            color: warning ? '#FF4D00' : color,
            textShadow: warning ? '0 0 8px rgba(255,77,0,0.6)' : `0 0 8px ${color}40`,
          }}
        >
          {value}
        </span>
        <span className="font-mono text-[9px] opacity-40 text-metal-light">{unit}</span>
      </div>
    </div>
  )
}

export default function HudStats() {
  const { launchPhase, energyPercent } = useGameStore()
  const { copy } = useSiteLanguage()
  const telemetry = useTelemetry()
  const isLaunching = launchPhase === 'ignition' || launchPhase === 'launched'

  return (
    <motion.div
      className="relative rounded-lg overflow-hidden"
      style={{
        background: 'rgba(7, 13, 26, 0.85)',
        border: '1px solid rgba(0, 212, 255, 0.12)',
        backdropFilter: 'blur(8px)',
        minWidth: 180,
      }}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: isLaunching ? '#FF4D00' : '#00D4FF' }}
        />
        <span className="font-mono text-[9px] text-metal-light opacity-50 tracking-widest uppercase">
          {copy.hud.title}
        </span>
      </div>

      <div className="px-3 py-2 space-y-0.5">
        <TelemetryRow
          label={copy.hud.thrust}
          value={Math.round(telemetry.thrust).toString()}
          unit="%"
          color="#FF8C00"
          warning={telemetry.thrust > 95}
        />
        <TelemetryRow
          label={copy.hud.fuel}
          value={Math.round(telemetry.fuel).toString()}
          unit="%"
          warning={telemetry.fuel < 20}
        />
        <TelemetryRow
          label={copy.hud.altitude}
          value={
            telemetry.altitude > 1000
              ? (telemetry.altitude / 1000).toFixed(1)
              : Math.round(telemetry.altitude).toString()
          }
          unit={telemetry.altitude > 1000 ? 'km' : 'm'}
          color="#00FFCC"
        />
        <TelemetryRow
          label={copy.hud.velocity}
          value={Math.round(telemetry.velocity).toString()}
          unit="m/s"
          color="#FFD700"
        />
        <TelemetryRow
          label={copy.hud.engineTemp}
          value={Math.round(telemetry.temp).toString()}
          unit="°C"
          warning={telemetry.temp > 2800}
        />
        <TelemetryRow
          label={copy.hud.energy}
          value={energyPercent.toString()}
          unit="%"
          color="#FF4D00"
          warning={energyPercent >= 90}
        />
      </div>

      {/* Bottom blinking cursor */}
      <div className="px-3 pb-2 pt-1">
        <span className="font-mono text-[9px] opacity-30 text-plasma-cyan">
          {copy.hud.sysOk} ▌
        </span>
      </div>
    </motion.div>
  )
}
