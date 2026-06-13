import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Trash2, X, Search } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import { useProject } from '../context/ProjectContext'
import { useAuth } from '../context/AuthContext'
import { projectService, type MemberResponse } from '../services/projectService'

type ProjectRole = 'ADMIN' | 'MANAGER' | 'MEMBER'

const roleConfig: Record<ProjectRole, { color: string; bg: string; label: string }> = {
  ADMIN:   { color: '#7c3aed', bg: '#f0e9fe', label: 'ADMIN' },
  MANAGER: { color: '#2563eb', bg: '#e4ecfd', label: 'MANAGER' },
  MEMBER:  { color: '#16a34a', bg: '#e7f6ec', label: 'MEMBER' },
}

function AddMemberModal({ existingEmails, onClose, onAdd }: {
  existingEmails: string[]
  onClose: () => void
  onAdd: (email: string, role: ProjectRole) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('MEMBER')
  const [error, setError] = useState('')

  function handleAdd() {
    if (!email.trim()) { setError('Nhập email'); return }
    if (existingEmails.includes(email.trim())) { setError('User đã trong dự án'); return }
    onAdd(email.trim(), role)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,21,43,.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(20,23,40,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, flex: 1 }}>Thêm thành viên</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#8a8fa3" /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Email *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', background: '#f4f5f8', border: `1.5px solid ${error ? '#dc2626' : '#e8eaf0'}`, borderRadius: 10 }}>
            <Search size={15} color="#9499ad" />
            <input value={email} onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="user@example.com"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '11px 0', fontFamily: 'inherit', fontSize: 14 }} />
          </div>
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 8 }}>Gán role</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['ADMIN', 'MANAGER', 'MEMBER'] as ProjectRole[]).map(r => {
              const rc = roleConfig[r]
              const active = role === r
              return (
                <button key={r} onClick={() => setRole(r)}
                  style={{ flex: 1, padding: '9px 4px', borderRadius: 9, background: active ? rc.bg : '#f4f5f8', border: `1.5px solid ${active ? rc.color + '55' : '#e8eaf0'}`, fontSize: 12.5, fontWeight: 700, color: active ? rc.color : '#8a8fa3', cursor: 'pointer' }}>
                  {r}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 12, color: '#8a8fa3', fontWeight: 600, marginTop: 8 }}>
            {role === 'ADMIN' && 'Toàn quyền: quản lý thành viên, xóa dự án'}
            {role === 'MANAGER' && 'Tạo/gán task, quản lý sprint'}
            {role === 'MEMBER' && 'Cập nhật task được gán, bình luận'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#f4f5f8', border: '1px solid #e8eaf0', fontSize: 14, fontWeight: 700, color: '#5b5f78', cursor: 'pointer' }}>Huỷ</button>
          <button onClick={handleAdd}
            style={{ flex: 2, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
            Thêm vào dự án
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const { activeProject } = useProject()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState<MemberResponse[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const projectId = activeProject?.id

  useEffect(() => {
    if (!projectId) { setLoading(false); return }
    setLoading(true)
    projectService.getMembers(projectId)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  const myRole = members.find(m => m.userId === currentUser?.id)?.role as ProjectRole | undefined
  const isAdmin = myRole === 'ADMIN'

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function handleAdd(email: string, role: ProjectRole) {
    if (!projectId) return
    try {
      const newMember = await projectService.addMember(projectId, email, role)
      setMembers(prev => [...prev, newMember])
      showToast(`Đã thêm ${newMember.username} với role ${role}`)
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Thêm thành viên thất bại')
    }
  }

  async function handleChangeRole(userId: number, newRole: ProjectRole) {
    if (!projectId) return
    const member = members.find(m => m.userId === userId)
    if (!window.confirm(`Đổi role của "${member?.username}" thành ${newRole}?`)) return
    try {
      const updated = await projectService.updateMemberRole(projectId, userId, newRole)
      setMembers(prev => prev.map(m => m.userId === userId ? updated : m))
      showToast(`Đã đổi role của ${member?.username} thành ${newRole}`)
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Đổi role thất bại')
    }
  }

  async function handleRemove(userId: number) {
    if (!projectId || userId === currentUser?.id) return
    const member = members.find(m => m.userId === userId)
    if (!window.confirm(`Xóa "${member?.username}" khỏi dự án?`)) return
    try {
      await projectService.removeMember(projectId, userId)
      setMembers(prev => prev.filter(m => m.userId !== userId))
      showToast('Đã xóa thành viên')
    } catch (err: any) {
      showToast(err.response?.data?.message ?? 'Xóa thất bại')
    }
  }

  if (!activeProject) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>👥</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1d29', marginBottom: 8 }}>Chưa chọn dự án</div>
          <div style={{ fontSize: 14, color: '#8a8fa3', fontWeight: 500, lineHeight: 1.6, marginBottom: 24 }}>
            Chọn một dự án từ danh sách để xem thành viên dự án.
          </div>
          <button onClick={() => navigate('/projects')}
            style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
            Đi đến danh sách dự án
          </button>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8', color: '#1a1d29' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 30px', background: '#fff', borderBottom: '1px solid #e8eaf0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginBottom: 6 }}>
              Dự án <span style={{ color: '#c4c8d4' }}>/</span> <span style={{ color: '#4b4f63' }}>Members</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.5px' }}>Thành viên — {activeProject.name}</h1>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
              <UserPlus size={16} /> Thêm thành viên
            </button>
          )}
        </header>

        <div style={{ flex: 1, padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{activeProject.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#e4ecfd', borderRadius: 999, padding: '2px 10px' }}>
              {members.length} thành viên
            </span>
            {myRole && (
              <span style={{ fontSize: 12, fontWeight: 700, color: roleConfig[myRole].color, background: roleConfig[myRole].bg, borderRadius: 999, padding: '2px 10px' }}>
                Bạn: {myRole}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ color: '#8a8fa3', fontSize: 14, fontWeight: 600 }}>Đang tải...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {members.map(pm => {
                const rc = roleConfig[pm.role as ProjectRole]
                const isSelf = pm.userId === currentUser?.id
                const initials = pm.username.slice(0, 2).toUpperCase()
                return (
                  <div key={pm.userId} style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, padding: '20px 22px', boxShadow: '0 1px 3px rgba(20,23,40,.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <Avatar initials={initials} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={52} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-.3px' }}>
                          {pm.username}
                          {isSelf && <span style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', marginLeft: 8 }}>(Bạn)</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginTop: 3 }}>{pm.email}</div>
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: rc.color, background: rc.bg, padding: '4px 10px', borderRadius: 7, letterSpacing: '.3px' }}>
                        {rc.label}
                      </span>
                    </div>

                    {isAdmin && !isSelf && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['ADMIN', 'MANAGER', 'MEMBER'] as ProjectRole[]).map(role => (
                          <button key={role} onClick={() => handleChangeRole(pm.userId, role)}
                            style={{ flex: 1, padding: '7px 4px', borderRadius: 8, background: pm.role === role ? roleConfig[role].bg : '#f4f5f8', border: `1.5px solid ${pm.role === role ? roleConfig[role].color + '44' : '#e8eaf0'}`, fontSize: 11.5, fontWeight: 700, color: pm.role === role ? roleConfig[role].color : '#8a8fa3', cursor: 'pointer' }}>
                            {role}
                          </button>
                        ))}
                        <button onClick={() => handleRemove(pm.userId)}
                          style={{ padding: '7px 10px', borderRadius: 8, background: '#fff0f0', border: '1.5px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={14} color="#dc2626" />
                        </button>
                      </div>
                    )}

                    {!isAdmin && (
                      <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSelf ? '#22c55e' : '#d1d5db', display: 'block' }} />
                        {isSelf ? 'Tài khoản của bạn' : 'Thành viên dự án'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddMemberModal
          existingEmails={members.map(m => m.email)}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#13152b', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(20,23,40,.2)', zIndex: 200 }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
