interface ProgressBarProps {
  value: number
  color?: string
  height?: number
}

export default function ProgressBar({ value, color = 'linear-gradient(90deg,#3b82f6,#2563eb)', height = 7 }: ProgressBarProps) {
  return (
    <div style={{ height, borderRadius: 999, background: '#eef0f5', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value}%`, borderRadius: 999, background: color, transition: 'width .3s' }} />
    </div>
  )
}
