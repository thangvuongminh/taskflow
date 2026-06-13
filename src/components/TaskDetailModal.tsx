import { useState, useEffect } from 'react'
import { X, MessageSquare, Send, Trash2, CheckCircle, Clock, Circle } from 'lucide-react'
import Avatar from './Avatar'
import PriorityBadge from './PriorityBadge'
import { useAuth } from '../context/AuthContext'
import { commentService, type CommentResponse } from '../services/commentService'
import type { TaskResponse } from '../services/taskService'
import type { Priority } from '../types'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  TODO:        { label: 'To Do',       color: '#5b5f78', bg: '#f1f2f7', icon: Circle },
  IN_PROGRESS: { label: 'In Progress', color: '#2563eb', bg: '#e4ecfd', icon: Clock },
  DONE:        { label: 'Done',        color: '#16a34a', bg: '#e7f6ec', icon: CheckCircle },
}

interface Props {
  task: TaskResponse
  canEdit: boolean
  onClose: () => void
  onUpdate: (updated: TaskResponse) => void
  onDelete?: () => void
}

export default function TaskDetailModal({ task, canEdit, onClose, onUpdate, onDelete }: Props) {
  const { user: currentUser } = useAuth()
  const [status, setStatus] = useState<TaskStatus>(task.status as TaskStatus)
  const [priority, setPriority] = useState<Priority>(task.priority as Priority)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [newComment, setNewComment] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const priorityConfig: Record<Priority, { color: string; bg: string }> = {
    HIGH:   { color: '#dc2626', bg: '#fde8e8' },
    MEDIUM: { color: '#d97706', bg: '#fdf0d9' },
    LOW:    { color: '#2563eb', bg: '#e4ecfd' },
  }

  useEffect(() => {
    commentService.getComments(task.id).then(setComments).catch(console.error)
  }, [task.id])

  function handleStatusChange(s: TaskStatus) {
    setStatus(s)
    onUpdate({ ...task, status: s })
  }

  function handlePriorityChange(p: Priority) {
    if (!canEdit) return
    setPriority(p)
    onUpdate({ ...task, priority: p })
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    try {
      const added = await commentService.addComment(task.id, newComment.trim())
      setComments(prev => [...prev, added])
      setNewComment('')
    } catch (e) { console.error(e) }
  }

  async function handleDeleteComment(id: number) {
    try {
      await commentService.deleteComment(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,21,43,.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(20,23,40,.2)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '22px 24px 18px', borderBottom: '1px solid #edeef3' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <PriorityBadge priority={priority} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7089', background: '#f1f2f7', padding: '3px 8px', borderRadius: 6 }}>{task.projectName}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-.3px', color: '#13152b', lineHeight: 1.3 }}>{task.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={20} color="#8a8fa3" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.4px', marginBottom: 8 }}>TRẠNG THÁI</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.entries(statusConfig) as [TaskStatus, typeof statusConfig[TaskStatus]][]).map(([s, cfg]) => {
                  const active = status === s
                  const Icon = cfg.icon
                  return (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${active ? cfg.color : '#e8eaf0'}`, background: active ? cfg.bg : '#fafafa', color: active ? cfg.color : '#8a8fa3', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Icon size={14} />{cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {task.description && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.4px', marginBottom: 8 }}>MÔ TẢ</div>
                <p style={{ margin: 0, fontSize: 14, color: '#4b4f63', lineHeight: 1.6, background: '#f8f9fc', borderRadius: 10, padding: '12px 14px' }}>{task.description}</p>
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.4px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={13} /> BÌNH LUẬN ({comments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                {comments.map(c => {
                  const isMine = c.user.id === currentUser?.id
                  const initials = c.user.username.slice(0, 2).toUpperCase()
                  return (
                    <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Avatar initials={initials} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={30} />
                      <div style={{ flex: 1, background: '#f4f5f8', borderRadius: '4px 12px 12px 12px', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#13152b' }}>{c.user.username}</span>
                          <span style={{ fontSize: 11.5, color: '#a0a4b8', fontWeight: 600 }}>
                            {new Date(c.createdAt).toLocaleDateString('vi', { day: '2-digit', month: '2-digit' })}
                          </span>
                          {isMine && (
                            <button onClick={() => handleDeleteComment(c.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                              <Trash2 size={12} color="#c4c8d4" />
                            </button>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13.5, color: '#4b4f63', lineHeight: 1.5 }}>{c.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <Avatar initials={currentUser?.username.slice(0, 2).toUpperCase() ?? 'U'} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={30} />
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                    placeholder="Thêm bình luận... (Enter để gửi)" rows={2}
                    style={{ width: '100%', padding: '10px 44px 10px 14px', borderRadius: 12, border: '1.5px solid #e8eaf0', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  <button onClick={handleAddComment} style={{ position: 'absolute', right: 10, bottom: 10, background: '#2563eb', border: 'none', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', display: 'flex' }}>
                    <Send size={14} color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ width: 180, flexShrink: 0 }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.4px', marginBottom: 8 }}>NGƯỜI THỰC HIỆN</div>
              {task.assignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar initials={task.assignee.username.slice(0, 2).toUpperCase()} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={28} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#13152b' }}>{task.assignee.username}</span>
                </div>
              ) : (
                <span style={{ fontSize: 13, color: '#a0a4b8', fontWeight: 600 }}>Chưa gán</span>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.4px', marginBottom: 8 }}>ĐỘ ƯU TIÊN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map(p => {
                  const c = priorityConfig[p]
                  const active = priority === p
                  return (
                    <button key={p} onClick={() => handlePriorityChange(p)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${active ? c.color + '55' : '#e8eaf0'}`, background: active ? c.bg : '#fafafa', fontSize: 11.5, fontWeight: 700, color: active ? c.color : '#a0a4b8', cursor: canEdit ? 'pointer' : 'default', textAlign: 'left' }}>
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.4px', marginBottom: 6 }}>STORY POINTS</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#13152b' }}>{task.storyPoints ?? '—'}</span>
              {task.storyPoints != null && <span style={{ fontSize: 12, color: '#a0a4b8', fontWeight: 600, marginLeft: 4 }}>pts</span>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8fa3', letterSpacing: '.4px', marginBottom: 6 }}>DEADLINE</div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#13152b' }}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi', { day: '2-digit', month: '2-digit' }) : 'Không có'}
              </span>
            </div>

            {canEdit && onDelete && (
              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #edeef3' }}>
                {!showDeleteConfirm ? (
                  <button onClick={() => setShowDeleteConfirm(true)}
                    style={{ width: '100%', padding: '8px', borderRadius: 8, background: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Trash2 size={13} /> Xóa task
                  </button>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Xác nhận xóa?</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '7px', borderRadius: 7, background: '#f4f5f8', border: '1px solid #e8eaf0', fontSize: 12, fontWeight: 700, color: '#5b5f78', cursor: 'pointer' }}>Huỷ</button>
                      <button onClick={() => { onDelete(); onClose() }} style={{ flex: 1, padding: '7px', borderRadius: 7, background: '#dc2626', border: 'none', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Xóa</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
