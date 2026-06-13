interface AvatarProps {
  initials: string
  gradient: string
  size?: number
}

export default function Avatar({ initials, gradient, size = 36 }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: gradient, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}
