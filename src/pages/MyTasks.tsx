import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import PriorityBadge from '../components/PriorityBadge'
import Avatar from '../components/Avatar'
import TaskDetailModal from '../components/TaskDetailModal'
import { taskService, type TaskResponse } from '../services/taskService'
import { projectService, type ProjectResponse } from '../services/projectService'
import type { Priority } from '../types'

type FilterStatus = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'
type FilterPriority = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  TODO:        { label: 'TO DO',       color: '#5b5f78', bg: '#f1f2f7' },
  IN_PROGRESS: { label: 'IN PROGRESS', color: '#2563eb', bg: '#e4ecfd' },
  DONE:        { label: 'DONE',        color: '#16a34a', bg: '#e7f6ec' },
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('ALL')
  const [filterProjectId, setFilterProjectId] = useState<number | 'ALL'>('ALL')
  const [detailTask, setDetailTask] = useState<TaskResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([taskService.getMyTasks(), projectService.getProjects()])
      .then(([taskData, projectData]) => { setTasks(taskData); setProjects(projectData) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = tasks.filter(t =>
    (filterStatus === 'ALL' || t.status === filterStatus) &&
    (filterPriority === 'ALL' || t.priority === filterPriority) &&
    (filterProjectId === 'ALL' || t.projectId === filterProjectId)
  )

  async function handleUpdate(updated: TaskResponse) {
    try {
      // Only status updates are allowed from MyTasks (user is assignee)
      await taskService.updateStatus(updated.id, updated.status)
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
      setDetailTask(updated)
    } catch (err: any) {
      // If it fails, revert
      console.error(err)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8', color: '#1a1d29' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ padding: '22px 34px', background: '#fff', borderBottom: '1px solid #e8eaf0' }}>
          <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginBottom: 7 }}>
            Cá nhân <span style={{ color: '#c4c8d4' }}>/</span> <span style={{ color: '#4b4f63' }}>My Tasks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.5px', flex: 1 }}>My Tasks</h1>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2563eb', background: '#e4ecfd', borderRadius: 999, padding: '3px 12px' }}>
              {filtered.length} task
            </span>
          </div>
        </header>

        <div style={{ flex: 1, padding: '20px 34px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {/* Status filter */}
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #edeef3', borderRadius: 10, overflow: 'hidden' }}>
              {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as FilterStatus[]).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ padding: '8px 14px', border: 'none', background: filterStatus === s ? '#2563eb' : 'transparent', color: filterStatus === s ? '#fff' : '#8a8fa3', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  {s === 'ALL' ? 'Tất cả' : s === 'IN_PROGRESS' ? 'Đang làm' : s === 'TODO' ? 'Chưa làm' : 'Xong'}
                </button>
              ))}
            </div>

            {/* Priority filter */}
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #edeef3', borderRadius: 10, overflow: 'hidden' }}>
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as FilterPriority[]).map(p => (
                <button key={p} onClick={() => setFilterPriority(p)}
                  style={{ padding: '8px 14px', border: 'none', background: filterPriority === p ? '#13152b' : 'transparent', color: filterPriority === p ? '#fff' : '#8a8fa3', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  {p === 'ALL' ? 'Tất cả' : p}
                </button>
              ))}
            </div>

            {/* Project filter */}
            <select value={filterProjectId} onChange={e => setFilterProjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              style={{ padding: '8px 14px', background: '#fff', border: '1px solid #edeef3', borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: '#5b5f78', cursor: 'pointer', outline: 'none' }}>
              <option value="ALL">Tất cả dự án</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a8fa3', fontSize: 14, fontWeight: 600 }}>Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a8fa3' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1d29', marginBottom: 8 }}>Không có task nào</div>
              <div style={{ fontSize: 13.5, color: '#8a8fa3', lineHeight: 1.6 }}>
                {filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterProjectId !== 'ALL'
                  ? 'Không có task khớp với bộ lọc hiện tại.'
                  : 'Bạn chưa được gán task nào. Liên hệ Manager/Admin của dự án để được gán task.'}
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,23,40,.04)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #edeef3' }}>
                    {['Task', 'Project', 'Priority', 'Status', 'Due date', 'Assignee'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.3px' }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => {
                    const s = statusLabel[t.status]
                    const isOverdue = t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'DONE'
                    return (
                      <tr key={t.id} onClick={() => setDetailTask(t)}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f8' : 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#13152b' }}>{t.title}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#6b7089', background: '#f1f2f7', padding: '3px 10px', borderRadius: 6 }}>{t.projectName}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}><PriorityBadge priority={t.priority as Priority} /></td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.color, background: s.bg, padding: '4px 10px', borderRadius: 6 }}>{s.label}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: isOverdue ? '#dc2626' : '#8a8fa3' }}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi', { day: '2-digit', month: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {t.assignee && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar initials={t.assignee.username.slice(0,2).toUpperCase()} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={28} />
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.assignee.username}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {detailTask && (
        <TaskDetailModal task={detailTask} canEdit={false} onClose={() => setDetailTask(null)} onUpdate={handleUpdate} />
      )}
    </div>
  )
}
