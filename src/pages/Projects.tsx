import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LayoutGrid, Users, TrendingDown, Calendar, X, Edit2, Trash2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useProject } from '../context/ProjectContext'
import { useAuth } from '../context/AuthContext'
import { projectService, type ProjectResponse } from '../services/projectService'

const DOT_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#06b6d4']

function CreateProjectModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, desc: string, start: string, end: string) => void
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,21,43,.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(20,23,40,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, flex: 1 }}>Tạo dự án mới</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#8a8fa3" /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Tên dự án *</label>
          <input value={name} onChange={e => { setName(e.target.value); setError('') }}
            placeholder="VD: Website PTIT"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${error ? '#dc2626' : '#e8eaf0'}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Mô tả</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            placeholder="Mô tả ngắn về dự án..."
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Ngày bắt đầu</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Ngày kết thúc</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#f4f5f8', border: '1px solid #e8eaf0', fontSize: 14, fontWeight: 700, color: '#5b5f78', cursor: 'pointer' }}>Huỷ</button>
          <button
            onClick={() => { if (!name.trim()) { setError('Tên không được trống'); return } onCreate(name.trim(), desc, startDate, endDate) }}
            style={{ flex: 2, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
            Tạo dự án
          </button>
        </div>
      </div>
    </div>
  )
}

function EditProjectModal({ project, onClose, onUpdate }: {
  project: ProjectResponse
  onClose: () => void
  onUpdate: (updated: ProjectResponse) => void
}) {
  const [name, setName] = useState(project.name)
  const [desc, setDesc] = useState(project.description || '')
  const [startDate, setStartDate] = useState(project.startDate || '')
  const [endDate, setEndDate] = useState(project.endDate || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim()) { setError('Tên không được trống'); return }
    setLoading(true)
    try {
      const updated = await projectService.updateProject(project.id, {
        name: name.trim(),
        description: desc || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      onUpdate(updated)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Cập nhật thất bại')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,21,43,.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(20,23,40,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, flex: 1 }}>Sửa dự án</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#8a8fa3" /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Tên dự án *</label>
          <input value={name} onChange={e => { setName(e.target.value); setError('') }}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${error ? '#dc2626' : '#e8eaf0'}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Mô tả</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Ngày bắt đầu</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#13152b', marginBottom: 6 }}>Ngày kết thúc</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#f4f5f8', border: '1px solid #e8eaf0', fontSize: 14, fontWeight: 700, color: '#5b5f78', cursor: 'pointer' }}>Huỷ</button>
          <button onClick={handleSave} disabled={loading}
            style={{ flex: 2, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { projects, setProjects, setActiveProject } = useProject()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    projectService.getProjects()
      .then(data => {
        setProjects(data)
        if (data.length > 0) setActiveProject(data[0])
      })
      .catch(() => setError('Không thể tải danh sách dự án'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(name: string, description: string, startDate: string, endDate: string) {
    try {
      const created = await projectService.createProject({
        name,
        description: description || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setProjects([...projects, created])
      setActiveProject(created)
      setShowCreateModal(false)
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Tạo dự án thất bại')
    }
  }

  function handleUpdate(updated: ProjectResponse) {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
    setActiveProject(updated)
  }

  async function handleDelete(p: ProjectResponse) {
    if (!window.confirm(`Xóa dự án "${p.name}"?\nToàn bộ sprint, task và thành viên sẽ bị xóa. Hành động này không thể hoàn tác.`)) return
    try {
      await projectService.deleteProject(p.id)
      setProjects(prev => prev.filter(proj => proj.id !== p.id))
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Xóa dự án thất bại')
    }
  }

  function openProject(p: ProjectResponse) {
    setActiveProject(p)
    navigate('/board')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8', color: '#1a1d29' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '22px 34px', background: '#fff', borderBottom: '1px solid #e8eaf0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginBottom: 6 }}>Trang chủ</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.5px' }}>Dự án của tôi</h1>
          </div>
          <button onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
            <Plus size={17} /> Tạo dự án
          </button>
        </header>

        <div style={{ flex: 1, padding: '28px 34px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8a8fa3' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Đang tải dự án...</div>
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#dc2626' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{error}</div>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8a8fa3' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Chưa có dự án nào</div>
              <div style={{ fontSize: 14 }}>Nhấn "+ Tạo dự án" để bắt đầu</div>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
              {projects.map((p, idx) => {
                const color = DOT_COLORS[idx % DOT_COLORS.length]
                const isCreator = p.createdBy.id === currentUser?.id
                return (
                  <div key={p.id}
                    style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,23,40,.04)', transition: 'box-shadow .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(20,23,40,.1)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(20,23,40,.04)')}>
                    <div style={{ height: 5, background: color }} />
                    <div style={{ padding: '20px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                        <div
                          onClick={() => openProject(p)}
                          style={{ width: 40, height: 40, borderRadius: 11, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                          <span style={{ width: 14, height: 14, borderRadius: '50%', background: color, display: 'block' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openProject(p)}>
                          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px', marginBottom: 4 }}>{p.name}</div>
                          <div style={{ fontSize: 13, color: '#8a8fa3', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || 'Chưa có mô tả'}</div>
                        </div>
                        {isCreator && (
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={e => { e.stopPropagation(); setEditingProject(p) }}
                              title="Sửa dự án"
                              style={{ width: 28, height: 28, borderRadius: 8, background: '#f4f5f8', border: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Edit2 size={13} color="#8a8fa3" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(p) }}
                              title="Xóa dự án"
                              style={{ width: 28, height: 28, borderRadius: 8, background: '#fff0f0', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Trash2 size={13} color="#dc2626" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => openProject(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginBottom: 16, cursor: 'pointer' }}>
                        <Calendar size={13} color="#8a8fa3" />
                        {p.startDate ?? '—'} → {p.endDate ?? '—'}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {[
                          { Icon: LayoutGrid,  route: 'board',    title: 'Kanban Board' },
                          { Icon: Users,       route: 'members',  title: 'Thành viên' },
                          { Icon: TrendingDown, route: 'burndown', title: 'Burndown Chart' },
                        ].map(({ Icon, route, title }) => (
                          <button key={route} title={title}
                            onClick={e => { e.stopPropagation(); setActiveProject(p); navigate('/' + route) }}
                            style={{ width: 30, height: 30, borderRadius: 8, background: '#f4f5f8', border: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Icon size={14} color="#8a8fa3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
