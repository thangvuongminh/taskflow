import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, LayoutGrid, TrendingDown, CheckSquare, Users, FolderKanban, ChevronRight, LogOut } from 'lucide-react'
import Avatar from './Avatar'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'

const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#06b6d4']

const navItems = [
  { path: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/projects',  label: 'Dự án',      icon: FolderKanban },
  { path: '/board',     label: 'Board',       icon: LayoutGrid },
  { path: '/burndown',  label: 'Burndown',    icon: TrendingDown },
  { path: '/my-tasks',  label: 'My Tasks',    icon: CheckSquare },
  { path: '/members',   label: 'Members',     icon: Users },
]

function ActiveProject() {
  const { activeProject, projects } = useProject()
  const navigate = useNavigate()
  if (!activeProject) return null
  const index = projects.findIndex(p => p.id === activeProject.id)
  const dotColor = COLORS[(index >= 0 ? index : 0) % COLORS.length]
  return (
    <div
      onClick={() => navigate('/projects')}
      style={{ margin: '16px 0 8px', padding: '10px 12px', borderRadius: 10, background: '#1c1f3a', cursor: 'pointer' }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.6px', color: '#5a5f7d', marginBottom: 6 }}>DỰ ÁN HIỆN TẠI</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'block' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeProject.name}</span>
        <ChevronRight size={13} color="#5a5f7d" />
      </div>
    </div>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  function handleLogout() { logout(); navigate('/login') }

  const initials = user ? user.username.slice(0, 2).toUpperCase() : '??'

  return (
    <aside style={{
      width: 248, flexShrink: 0, background: '#13152b', color: '#aeb2c7',
      display: 'flex', flexDirection: 'column', padding: '22px 16px',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 26px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(59,130,246,.45)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: '-.4px' }}>TaskFlow</span>
      </div>

      {/* Section label */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.8px', color: '#5a5f7d', padding: '6px 10px 8px' }}>
        QUẢN LÝ
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {navItems.map(item => {
          const active = pathname === item.path
          const Icon = item.icon
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? '#fff' : '#aeb2c7',
                background: active ? '#262a4d' : 'transparent',
                transition: 'all .15s',
              }}
            >
              <Icon size={17} color={active ? '#7eaaff' : '#6a6f8d'} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </div>
          )
        })}
      </nav>

      {/* Active project indicator */}
      <ActiveProject />

      {/* User card */}
      <div style={{
        marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 11,
        padding: 12, borderRadius: 12, background: '#1c1f3a', cursor: 'pointer',
      }}>
        <Avatar initials={initials} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{user?.username ?? ''}</div>
          <div style={{ fontSize: 12, color: '#6a6f8d' }}>{user?.email ?? ''}</div>
        </div>
      </div>

      {/* Logout */}
      <div style={{ marginTop: 12, padding: '12px 0 0', borderTop: '1px solid #1c1f3a' }}>
        {user && <div style={{ fontSize: 12, color: '#5a5f7d', fontWeight: 600, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>{user.email}</div>}
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 9, background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.25)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </aside>
  )
}
