import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, ChevronDown, X, GripVertical } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import PriorityBadge from '../components/PriorityBadge'
import TaskDetailModal from '../components/TaskDetailModal'
import { useProject } from '../context/ProjectContext'
import { useAuth } from '../context/AuthContext'
import { taskService, type TaskResponse } from '../services/taskService'
import { sprintService, type SprintResponse } from '../services/sprintService'
import { projectService, type MemberResponse } from '../services/projectService'
import type { Priority } from '../types'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

interface Column { id: TaskStatus; label: string; dotColor: string; tasks: TaskResponse[] }

const colDotColors: Record<TaskStatus, string> = { TODO: '#94a3b8', IN_PROGRESS: '#6366f1', DONE: '#22c55e' }
const TODAY = new Date().toISOString().split('T')[0]

function TaskCard({ task, isDragging = false, listeners }: {
  task: TaskResponse; isDragging?: boolean; listeners?: ReturnType<typeof useSortable>['listeners']
}) {
  const isOverdue = task.dueDate && task.dueDate < TODAY && task.status !== 'DONE'
  return (
    <div style={{ background: '#fff', borderRadius: 13, padding: '14px 15px', boxShadow: isDragging ? '0 8px 24px rgba(20,23,40,.14)' : '0 1px 3px rgba(20,23,40,.04)', border: '1px solid #edeef3', cursor: isDragging ? 'grabbing' : 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <PriorityBadge priority={task.priority as Priority} />
        {task.sprintName && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7089', background: '#f1f2f7', padding: '3px 8px', borderRadius: 6 }}>{task.sprintName}</span>}
        {listeners && (
          <div
            {...listeners}
            onClick={e => e.stopPropagation()}
            style={{ marginLeft: 'auto', cursor: 'grab', color: '#c4c8d4', padding: '2px 4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <GripVertical size={14} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginBottom: 10, color: '#13152b', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? '#dc2626' : '#8a8fa3' }}>
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi', { day: '2-digit', month: '2-digit' }) : '—'}
        </span>
        {task.storyPoints != null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#8a8fa3', background: '#f1f2f7', padding: '2px 7px', borderRadius: 6 }}>{task.storyPoints}pt</span>
        )}
        <div style={{ flex: 1 }} />
        {task.assignee && <Avatar initials={task.assignee.username.slice(0,2).toUpperCase()} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={26} />}
      </div>
    </div>
  )
}

function SortableTaskCard({ task, onOpen }: { task: TaskResponse; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(task.id) })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes}
      onClick={onOpen}
    >
      <TaskCard task={task} listeners={listeners} />
    </div>
  )
}

function CreateTaskModal({ projectId, activeSprint, members, defaultStatus, onClose, onCreate }: {
  projectId: number; activeSprint: SprintResponse | null; members: MemberResponse[]
  defaultStatus: TaskStatus; onClose: () => void; onCreate: (t: TaskResponse) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [assigneeId, setAssigneeId] = useState('')
  const [storyPoints, setStoryPoints] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pc: Record<Priority, { color: string; bg: string }> = {
    HIGH: { color: '#dc2626', bg: '#fde8e8' },
    MEDIUM: { color: '#d97706', bg: '#fdf0d9' },
    LOW: { color: '#2563eb', bg: '#e4ecfd' },
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Tiêu đề không được trống'); return }
    setLoading(true)
    try {
      const t = await taskService.createTask(projectId, {
        title: title.trim(), description: description || undefined, status, priority,
        storyPoints: parseInt(storyPoints) || undefined,
        assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
        sprintId: activeSprint?.id, dueDate: dueDate || undefined,
      })
      onCreate(t); onClose()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Tạo task thất bại')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,21,43,.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(20,23,40,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, flex: 1 }}>Tạo Task mới</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#8a8fa3" /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Tiêu đề *</label>
          <input value={title} onChange={e => { setTitle(e.target.value); setError('') }} placeholder="VD: Viết API đăng nhập"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${error ? '#dc2626' : '#e8eaf0'}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Mô tả</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Trạng thái</label>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', background: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value="TODO">TO DO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Độ ưu tiên</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  style={{ flex: 1, padding: '10px 4px', borderRadius: 8, background: priority === p ? pc[p].bg : '#f4f5f8', border: `1.5px solid ${priority === p ? pc[p].color + '55' : '#e8eaf0'}`, fontSize: 11, fontWeight: 800, color: priority === p ? pc[p].color : '#8a8fa3', cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Gán cho</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', background: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value="">Chưa gán</option>
              {members.map(m => <option key={m.userId} value={String(m.userId)}>{m.username}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Sprint</label>
            <input readOnly value={activeSprint?.name ?? 'Backlog'}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', background: '#f9f9fb', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Story Points</label>
            <input type="number" value={storyPoints} onChange={e => setStoryPoints(e.target.value)} min={0} max={100} placeholder="0"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Deadline</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8eaf0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#f4f5f8', border: '1px solid #e8eaf0', fontSize: 14, fontWeight: 700, color: '#5b5f78', cursor: 'pointer' }}>Huỷ</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex: 2, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
            {loading ? 'Đang tạo...' : 'Tạo Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Board() {
  const { activeProject } = useProject()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [columns, setColumns] = useState<Column[]>([
    { id: 'TODO',        label: 'TO DO',       dotColor: colDotColors.TODO,        tasks: [] },
    { id: 'IN_PROGRESS', label: 'IN PROGRESS', dotColor: colDotColors.IN_PROGRESS, tasks: [] },
    { id: 'DONE',        label: 'DONE',        dotColor: colDotColors.DONE,        tasks: [] },
  ])
  const [, setSprints] = useState<SprintResponse[]>([])
  const [members, setMembers] = useState<MemberResponse[]>([])
  const [activeSprint, setActiveSprint] = useState<SprintResponse | null>(null)
  const [activeTask, setActiveTask] = useState<TaskResponse | null>(null)
  const [detailTask, setDetailTask] = useState<TaskResponse | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>('TODO')
  const [loading, setLoading] = useState(true)

  const projectId = activeProject?.id
  const myRole = members.find(m => m.userId === currentUser?.id)?.role
  const canEdit = myRole === 'ADMIN' || myRole === 'MANAGER'

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    Promise.all([sprintService.getSprints(projectId), projectService.getMembers(projectId)])
      .then(([sprintData, memberData]) => {
        setSprints(sprintData); setMembers(memberData)
        const active = sprintData.find(s => s.status === 'ACTIVE') ?? sprintData[0] ?? null
        setActiveSprint(active)
        return active ? taskService.getTasks(projectId, active.id) : taskService.getTasks(projectId)
      })
      .then(tasks => setColumns(prev => prev.map(col => ({ ...col, tasks: tasks.filter(t => t.status === col.id) }))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  function handleDragStart(event: DragStartEvent) {
    const task = columns.flatMap(c => c.tasks).find(t => String(t.id) === event.active.id)
    if (task) setActiveTask(task)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over || active.id === over.id) return
    const srcCol = columns.find(c => c.tasks.some(t => String(t.id) === active.id))!
    const dstCol = columns.find(c => c.tasks.some(t => String(t.id) === over.id)) ?? srcCol
    if (srcCol.id === dstCol.id) return
    const task = srcCol.tasks.find(t => String(t.id) === active.id)!
    setColumns(prev => prev.map(c => {
      if (c.id === srcCol.id) return { ...c, tasks: c.tasks.filter(t => String(t.id) !== String(active.id)) }
      if (c.id === dstCol.id) return { ...c, tasks: [...c.tasks, { ...task, status: c.id }] }
      return c
    }))
    try { await taskService.updateStatus(task.id, dstCol.id) }
    catch {
      setColumns(prev => prev.map(c => {
        if (c.id === dstCol.id) return { ...c, tasks: c.tasks.filter(t => String(t.id) !== String(active.id)) }
        if (c.id === srcCol.id) return { ...c, tasks: [...c.tasks, task] }
        return c
      }))
    }
  }

  function handleCreateTask(newTask: TaskResponse) {
    setColumns(prev => prev.map(col => col.id === newTask.status ? { ...col, tasks: [...col.tasks, newTask] } : col))
  }

  async function handleUpdateTask(updated: TaskResponse) {
    const original = columns.flatMap(c => c.tasks).find(t => t.id === updated.id)
    if (original?.status !== updated.status) {
      try {
        await taskService.updateStatus(updated.id, updated.status)
      } catch (err: any) {
        alert(err.response?.data?.message ?? 'Cập nhật trạng thái thất bại')
        return
      }
    }
    setColumns(prev => prev.map(col => {
      const without = col.tasks.filter(t => t.id !== updated.id)
      return col.id === updated.status ? { ...col, tasks: [...without, updated] } : { ...col, tasks: without }
    }))
    setDetailTask(updated)
  }

  async function handleDeleteTask(taskId: number) {
    try {
      await taskService.deleteTask(taskId)
      setColumns(prev => prev.map(col => ({ ...col, tasks: col.tasks.filter(t => t.id !== taskId) })))
      setDetailTask(null)
    } catch (err: any) { alert(err.response?.data?.message ?? 'Xóa task thất bại') }
  }

  if (!activeProject) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🗂️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1d29', marginBottom: 8 }}>Chưa chọn dự án</div>
          <div style={{ fontSize: 14, color: '#8a8fa3', fontWeight: 500, lineHeight: 1.6, marginBottom: 24 }}>
            Chọn một dự án từ danh sách để xem Kanban Board.
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
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 30px', background: '#fff', borderBottom: '1px solid #e8eaf0', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginBottom: 6 }}>Dự án / Board</div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-.5px' }}>Kanban Board</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', background: '#f4f5f8', border: '1px solid #e8eaf0', borderRadius: 10, fontSize: 13.5, fontWeight: 700, marginLeft: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'block' }} />
            {activeProject.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', background: '#f4f5f8', border: '1px solid #e8eaf0', borderRadius: 10, fontSize: 13.5, fontWeight: 700 }}>
            {activeSprint?.name ?? 'Backlog'} <ChevronDown size={14} color="#8a8fa3" />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex' }}>
            {members.slice(0, 4).map((m, i) => (
              <div key={m.userId} style={{ marginLeft: i === 0 ? 0 : -8, border: '2px solid #f4f5f8', borderRadius: '50%' }}>
                <Avatar initials={m.username.slice(0,2).toUpperCase()} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={32} />
              </div>
            ))}
          </div>
          {canEdit && (
            <button onClick={() => { setCreateDefaultStatus('TODO'); setShowCreateModal(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,.35)' }}>
              <Plus size={16} /> Tạo Task
            </button>
          )}
        </header>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8fa3', fontSize: 14, fontWeight: 600 }}>Đang tải board...</div>
        ) : (
          <div style={{ flex: 1, overflowX: 'auto', padding: '24px 30px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {columns.map(col => (
                <div key={col.id} style={{ width: 320, flexShrink: 0, background: '#eef0f5', borderRadius: 16, padding: '14px 14px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.dotColor, display: 'block' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#3a3f56' }}>{col.label}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#8a8fa3', background: '#e2e4ed', borderRadius: 999, padding: '2px 9px' }}>{col.tasks.length}</span>
                  </div>
                  <SortableContext items={col.tasks.map(t => String(t.id))} strategy={verticalListSortingStrategy}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 60 }}>
                      {col.tasks.map(task => (
                        <SortableTaskCard key={task.id} task={task} onOpen={() => setDetailTask(task)} />
                      ))}
                    </div>
                  </SortableContext>
                  {canEdit && (
                    <button onClick={() => { setCreateDefaultStatus(col.id); setShowCreateModal(true) }}
                      style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 10, background: 'transparent', border: '1.5px dashed #c8cad6', color: '#8a8fa3', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Plus size={14} /> Thêm task
                    </button>
                  )}
                </div>
              ))}
              <DragOverlay>{activeTask && <TaskCard task={activeTask} isDragging />}</DragOverlay>
            </DndContext>
          </div>
        )}
      </main>

      {showCreateModal && projectId && (
        <CreateTaskModal projectId={projectId} activeSprint={activeSprint} members={members}
          defaultStatus={createDefaultStatus} onClose={() => setShowCreateModal(false)} onCreate={handleCreateTask} />
      )}

      {detailTask && (
        <TaskDetailModal task={detailTask} canEdit={canEdit} onClose={() => setDetailTask(null)}
          onUpdate={handleUpdateTask} onDelete={canEdit ? () => handleDeleteTask(detailTask.id) : undefined} />
      )}
    </div>
  )
}
