import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import ProgressBar from '../components/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { dashboardService, type DashboardResponse, type SprintProgressResponse } from '../services/dashboardService'
import type { TaskResponse } from '../services/taskService'

function TodayTaskCard({ task }: { task: TaskResponse }) {
  const isInProgress = task.status === 'IN_PROGRESS'
  const accent = isInProgress ? '#2563eb' : '#7c3aed'
  const statusLabel = isInProgress ? 'ĐANG LÀM' : 'CẦN LÀM'
  const statusColor = isInProgress ? '#2563eb' : '#7c3aed'
  const statusBg = isInProgress ? '#e4ecfd' : '#f0e9fe'

  return (
    <div style={{ border: '1px solid #eef0f5', borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.4px', color: statusColor, background: statusBg, padding: '4px 9px', borderRadius: 7 }}>{statusLabel}</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7089', background: '#f1f2f7', padding: '4px 9px', borderRadius: 7 }}>{task.projectName}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Hôm nay</span>
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-.2px', lineHeight: 1.4, marginBottom: 14 }}>{task.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        {task.storyPoints != null && <span style={{ fontSize: 12, fontWeight: 700, color: '#8a8fa3' }}>{task.storyPoints} pts</span>}
        <div style={{ flex: 1 }} />
        {task.assignee && <Avatar initials={task.assignee.username.slice(0,2).toUpperCase()} gradient="linear-gradient(135deg,#6366f1,#2563eb)" size={26} />}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getMyFocus().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  const todayTasks = data?.todayTasks ?? []
  const upcomingTasks = data?.upcomingTasks ?? []
  const sprintProgress = data?.sprintProgress ?? []

  const today = new Date().toLocaleDateString('vi', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  const kpiCards = [
    { value: String(data ? 0 : 0), label: 'Hoàn thành tuần này', delta: '+0 hôm nay', deltaColor: '#16a34a', deltaBg: '#e7f6ec', iconBg: '#e7f6ec', icon: '✅' },
    { value: String(todayTasks.filter(t => t.status === 'IN_PROGRESS').length), label: 'Đang thực hiện', delta: 'Active', deltaColor: '#2563eb', deltaBg: '#e4ecfd', iconBg: '#e4ecfd', icon: '⚡' },
    { value: String(todayTasks.length), label: 'Task hôm nay', delta: 'Hôm nay', deltaColor: '#dc2626', deltaBg: '#fde8e8', iconBg: '#fde8e8', icon: '⏰' },
    { value: String(sprintProgress.length), label: 'Sprint đang chạy', delta: 'Active', deltaColor: '#d97706', deltaBg: '#fdf0d9', iconBg: '#fdf0d9', icon: '📊' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8fa3', fontSize: 15, fontWeight: 600 }}>Đang tải...</main>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8', color: '#1a1d29' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px 34px 22px', background: '#fff', borderBottom: '1px solid #e8eaf0' }}>
          <div>
            <h1 style={{ margin: '0 0 7px', fontSize: 24, fontWeight: 800, letterSpacing: '-.6px' }}>
              Xin chào, {user?.username ?? 'bạn'} <span style={{ fontWeight: 400 }}>👋</span>
            </h1>
            <div style={{ fontSize: 13.5, color: '#8a8fa3', fontWeight: 600 }}>
              Hôm nay {today} · Bạn có <span style={{ color: '#2563eb', fontWeight: 700 }}>{todayTasks.length} task</span> cần hoàn thành
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', background: '#f4f5f8', border: '1px solid #e8eaf0', borderRadius: 10, padding: '0 12px', gap: 8, width: 230 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9499ad" strokeWidth="2"/><path d="M20 20l-3-3" stroke="#9499ad" strokeWidth="2" strokeLinecap="round"/></svg>
            <input placeholder="Tìm task..." style={{ border: 'none', background: 'transparent', outline: 'none', padding: '9px 0', fontFamily: 'inherit', fontSize: 13.5, color: '#1a1d29', width: '100%' }} />
          </div>
          <div style={{ position: 'relative', width: 42, height: 42, borderRadius: 11, background: '#f4f5f8', border: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Bell size={19} color="#5b5f78" />
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '26px 34px 36px' }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 26 }}>
            {kpiCards.map(c => (
              <div key={c.label} style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(20,23,40,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{c.icon}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.deltaColor, background: c.deltaBg, padding: '3px 8px', borderRadius: 7 }}>{c.delta}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#8a8fa3', marginTop: 6 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 22, alignItems: 'start' }}>
            {/* Task hôm nay */}
            <section style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, padding: 22, boxShadow: '0 1px 3px rgba(20,23,40,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>Task hôm nay</h2>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#e4ecfd', borderRadius: 999, padding: '2px 10px' }}>{todayTasks.length} việc</span>
              </div>
              {todayTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#8a8fa3', fontSize: 13.5, fontWeight: 600 }}>Không có task nào hôm nay 🎉</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {todayTasks.map(t => <TodayTaskCard key={t.id} task={t} />)}
                </div>
              )}
            </section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Sắp đến deadline */}
              <section style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, padding: 22, boxShadow: '0 1px 3px rgba(20,23,40,.04)' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>Sắp đến deadline</h2>
                {upcomingTasks.length === 0 ? (
                  <div style={{ color: '#8a8fa3', fontSize: 13.5, fontWeight: 600 }}>Không có task sắp deadline</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {upcomingTasks.map(t => {
                      const dotColor = t.priority === 'HIGH' ? '#dc2626' : t.priority === 'MEDIUM' ? '#d97706' : '#2563eb'
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: `0 0 0 3px ${dotColor}22` }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.title}</div>
                            <div style={{ fontSize: 12, color: '#8a8fa3', fontWeight: 600, marginTop: 2 }}>{t.projectName}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#8a8fa3' }}>
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi', { day: '2-digit', month: '2-digit' }) : ''}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Tiến độ Sprint */}
              <section style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, padding: 22, boxShadow: '0 1px 3px rgba(20,23,40,.04)' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>Tiến độ Sprint</h2>
                {sprintProgress.length === 0 ? (
                  <div style={{ color: '#8a8fa3', fontSize: 13.5, fontWeight: 600 }}>Không có sprint đang chạy</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {sprintProgress.map((s: SprintProgressResponse) => {
                      const pct = s.totalTasks > 0 ? Math.round(s.doneTasks / s.totalTasks * 100) : 0
                      return (
                        <div key={s.sprintId}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{s.projectName}</div>
                              <div style={{ fontSize: 12, color: '#8a8fa3', fontWeight: 600, marginTop: 2 }}>{s.sprintName}</div>
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>{pct}%</span>
                          </div>
                          <ProgressBar value={pct} />
                          <div style={{ fontSize: 12, color: '#8a8fa3', fontWeight: 600, marginTop: 6 }}>{s.donePoints} / {s.totalPoints} story points</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
