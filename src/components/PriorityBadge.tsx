import type { Priority } from '../types'

const config: Record<Priority, { text: string; color: string; bg: string }> = {
  HIGH:   { text: 'HIGH',   color: '#dc2626', bg: '#fde8e8' },
  MEDIUM: { text: 'MEDIUM', color: '#d97706', bg: '#fdf0d9' },
  LOW:    { text: 'LOW',    color: '#2563eb', bg: '#e4ecfd' },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const c = config[priority]
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 800, letterSpacing: '.4px',
      color: c.color, background: c.bg,
      padding: '3px 8px', borderRadius: 6,
    }}>
      {c.text}
    </span>
  )
}
