import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, CheckCircle, X, Calendar } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useProject } from '../context/ProjectContext'
import { useAuth } from '../context/AuthContext'
import { sprintService, type SprintResponse } from '../services/sprintService'
import { projectService } from '../services/projectService'

function CreateSprintModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, goal: string, startDate: string, endDate: string) => void
}) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,21,43,.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(20,23,40,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, flex: 1 }}>Tạo Sprint mới</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#8a8fa3" /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Tên Sprint *</label>
          <input value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="VD: Sprint 3"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${error ? '#dc2626' : '#e8eaf0'}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Mục tiêu Sprint</label>
          <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2}
            placeholder="Hoàn thành chức năng xác thực..."
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[['Ngày bắt đầu', startDate, setStartDate], ['Ngày kết thúc', endDate, setEndDate]].map(([label, val, setter]) => (
            <div key={label as string}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>{label as string}</label>
              <input type="date" value={val as string} onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#f4f5f8', border: '1px solid #e8eaf0', fontSize: 14, fontWeight: 700, color: '#5b5f78', cursor: 'pointer' }}>Huỷ</button>
          <button onClick={() => { if (!name.trim()) { setError('Tên sprint không được trống'); return } onCreate(name.trim(), goal, startDate, endDate) }}
            style={{ flex: 2, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
            Tạo Sprint
          </button>
        </div>
      </div>
    </div>
  )
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PLANNING:  { label: 'Lên kế hoạch', color: '#8a8fa3', bg: '#f1f2f7' },
  ACTIVE:    { label: 'Đang chạy',    color: '#16a34a', bg: '#e7f6ec' },
  COMPLETED: { label: 'Đã hoàn thành', color: '#2563eb', bg: '#e4ecfd' },
}

export default function Sprints() {
  const { activeProject } = useProject()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [sprints, setSprints] = useState<SprintResponse[]>([])
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [myRole, setMyRole] = useState<string | null>(null)

  const projectId = activeProject?.id
  const canManage = myRole === 'ADMIN' || myRole === 'MANAGER'
  const hasActive = sprints.some(s => s.status === 'ACTIVE')

  useEffect(() => {
    if (!projectId) { setLoading(false); return }
    setLoading(true)
    Promise.all([sprintService.getSprints(projectId), projectService.getMembers(projectId)])
      .then(([sprintData, memberData]) => {
        setSprints(sprintData)
        const me = memberData.find(m => m.userId === currentUser?.id)
        setMyRole(me?.role ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId, currentUser?.id])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function handleStart(id: number) {
    if (hasActive) { showToast('Hãy kết thúc sprint đang chạy trước!'); return }
    try {
      const updated = await sprintService.startSprint(id)
      setSprints(prev => prev.map(s => s.id === id ? updated : s))
      showToast('Sprint đã bắt đầu!')
    } catch (err: any) { showToast(err.response?.data?.message ?? 'Bắt đầu thất bại') }
  }

  async function handleComplete(id: number) {
    try {
      const updated = await sprintService.completeSprint(id)
      setSprints(prev => prev.map(s => s.id === id ? updated : s))
      showToast('Sprint đã kết thúc!')
    } catch (err: any) { showToast(err.response?.data?.message ?? 'Kết thúc thất bại') }
  }

  async function handleCreate(name: string, goal: string, startDate: string, endDate: string) {
    if (!projectId) return
    try {
      const created = await sprintService.createSprint(projectId, {
        name, goal: goal || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setSprints(prev => [created, ...prev])
      showToast(`Đã tạo ${created.name}`)
      setShowModal(false)
    } catch (err: any) { showToast(err.response?.data?.message ?? 'Tạo sprint thất bại') }
  }

  if (!activeProject) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏃</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1d29', marginBottom: 8 }}>Chưa chọn dự án</div>
          <div style={{ fontSize: 14, color: '#8a8fa3', fontWeight: 500, lineHeight: 1.6, marginBottom: 24 }}>
            Chọn một dự án từ danh sách để xem danh sách Sprint.
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
        <header style={{ display: 'flex', alignItems: 'center', padding: '18px 30px', background: '#fff', borderBottom: '1px solid #e8eaf0', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginBottom: 6 }}>
              Dự án <span style={{ color: '#c4c8d4' }}>/</span> <span style={{ color: '#4b4f63' }}>Sprints</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.5px' }}>Quản lý Sprint</h1>
              <span style={{ fontSize: 13.5, fontWeight: 700, padding: '6px 12px', background: '#f4f5f8', border: '1px solid #e8eaf0', borderRadius: 9 }}>
                {activeProject.name}
              </span>
            </div>
          </div>
          {canManage && (
            <button onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
              <Plus size={16} /> Tạo Sprint
            </button>
          )}
        </header>

        <div style={{ flex: 1, padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div style={{ color: '#8a8fa3', fontSize: 14, fontWeight: 600 }}>Đang tải sprints...</div>
          ) : sprints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a8fa3' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏃</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1d29', marginBottom: 8 }}>Chưa có sprint nào</div>
              <div style={{ fontSize: 13.5, color: '#8a8fa3', lineHeight: 1.6, marginBottom: canManage ? 20 : 0 }}>
                Sprint giúp nhóm tổ chức task theo từng chu kỳ làm việc.
              </div>
              {canManage && (
                <button onClick={() => setShowModal(true)}
                  style={{ padding: '11px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
                  + Tạo Sprint đầu tiên
                </button>
              )}
            </div>
          ) : sprints.map(sprint => {
            const cfg = statusConfig[sprint.status]
            const pct = sprint.totalTasks > 0 ? Math.round(sprint.doneTasks / sprint.totalTasks * 100) : 0
            return (
              <div key={sprint.id} style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, padding: '20px 24px', boxShadow: '0 1px 3px rgba(20,23,40,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>{sprint.name}</h3>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: 6 }}>{cfg.label}</span>
                    </div>
                    {sprint.goal && <p style={{ margin: '0 0 12px', fontSize: 13.5, color: '#6b7089', fontWeight: 500 }}>{sprint.goal}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8a8fa3', fontWeight: 600, marginBottom: sprint.totalTasks > 0 ? 14 : 0 }}>
                      <Calendar size={13} />
                      {sprint.startDate ?? '—'} → {sprint.endDate ?? '—'}
                      {sprint.totalTasks > 0 && <span style={{ marginLeft: 8, color: '#4b4f63' }}>· {sprint.doneTasks}/{sprint.totalTasks} tasks</span>}
                    </div>
                    {sprint.totalTasks > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#eef0f5', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#3b82f6,#2563eb)', transition: 'width .3s' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#2563eb', minWidth: 36 }}>{pct}%</span>
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {sprint.status === 'PLANNING' && (
                        <button onClick={() => handleStart(sprint.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: '#e7f6ec', border: '1.5px solid #22c55e44', color: '#16a34a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          <Play size={14} /> Bắt đầu
                        </button>
                      )}
                      {sprint.status === 'ACTIVE' && (
                        <button onClick={() => handleComplete(sprint.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: '#e4ecfd', border: '1.5px solid #2563eb44', color: '#2563eb', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          <CheckCircle size={14} /> Kết thúc
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {showModal && <CreateSprintModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#13152b', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(20,23,40,.2)', zIndex: 300 }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
