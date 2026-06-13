import { useState, useRef, useEffect } from 'react'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, LineController, Tooltip, Filler } from 'chart.js'
import { ChevronDown } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useProject } from '../context/ProjectContext'
import { sprintService, type SprintResponse, type BurndownDataResponse } from '../services/sprintService'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Tooltip, Filler)

type Mode = 'task' | 'point'

export default function Burndown() {
  const { activeProject } = useProject()
  const [mode, setMode] = useState<Mode>('task')
  const [sprints, setSprints] = useState<SprintResponse[]>([])
  const [selectedSprint, setSelectedSprint] = useState<SprintResponse | null>(null)
  const [burndown, setBurndown] = useState<BurndownDataResponse | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  const projectId = activeProject?.id

  useEffect(() => {
    if (!projectId) return
    sprintService.getSprints(projectId).then(data => {
      setSprints(data)
      const active = data.find(s => s.status === 'ACTIVE') ?? data[0] ?? null
      setSelectedSprint(active)
    }).catch(console.error)
  }, [projectId])

  useEffect(() => {
    if (!selectedSprint) return
    sprintService.getBurndown(selectedSprint.id).then(setBurndown).catch(console.error)
  }, [selectedSprint])

  useEffect(() => {
    if (!canvasRef.current || !burndown) return
    const existing = Chart.getChart(canvasRef.current)
    if (existing) existing.destroy()
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const data = mode === 'task' ? burndown.byTask : burndown.byPoint
    if (!data || data.length === 0) return

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          { label: 'Ideal', data: data.map(d => d.ideal), borderColor: '#2563eb', borderDash: [7, 6], borderWidth: 2, pointRadius: 0, tension: 0 },
          { label: 'Thực tế', data: data.map(d => d.actual), borderColor: '#ef4444', borderWidth: 3, pointBackgroundColor: '#fff', pointBorderColor: '#ef4444', pointBorderWidth: 2, pointRadius: 4, tension: 0.25, fill: true, backgroundColor: 'rgba(239,68,68,.08)', spanGaps: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13152b', titleColor: '#aeb2c7', bodyColor: '#fff', cornerRadius: 10, padding: 12 } },
        scales: {
          x: { grid: { color: '#f0f1f5' }, ticks: { color: '#8a8fa3', font: { size: 12 } } },
          y: { grid: { color: '#f0f1f5' }, ticks: { color: '#8a8fa3', font: { size: 12 } }, title: { display: true, text: mode === 'task' ? 'Số task' : 'Story Points', color: '#8a8fa3', font: { size: 12 } } },
        },
      },
    })
    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [mode, burndown])

  const sprint = selectedSprint
  const total = sprint ? (mode === 'task' ? sprint.totalTasks : sprint.totalPoints) : 0
  const done  = sprint ? (mode === 'task' ? sprint.doneTasks  : sprint.donePoints)  : 0

  if (!activeProject) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8fa3', fontSize: 15, fontWeight: 600 }}>
        Chọn một dự án để xem Burndown
      </main>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f5f8', color: '#1a1d29' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 34px', background: '#fff', borderBottom: '1px solid #e8eaf0' }}>
          <div>
            <div style={{ fontSize: 12.5, color: '#8a8fa3', fontWeight: 600, marginBottom: 7 }}>Báo cáo / Burndown</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.5px' }}>
              Burndown Chart — <span style={{ color: '#6366f1' }}>{activeProject.name}</span>
            </h1>
          </div>
          <div style={{ flex: 1 }} />

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#f1f2f7', border: '1px solid #e8eaf0', borderRadius: 11, padding: 4, gap: 3 }}>
            {(['task', 'point'] as Mode[]).map(m => (
              <div key={m} onClick={() => setMode(m)}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#13152b' : '#8a8fa3', boxShadow: mode === m ? '0 1px 4px rgba(20,23,40,.1)' : 'none' }}>
                {m === 'task' ? 'Task Count' : 'Story Points'}
              </div>
            ))}
          </div>

          {/* Sprint selector */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: '#f4f5f8', border: '1px solid #e8eaf0', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
              {sprint?.name ?? 'Chọn sprint'} <ChevronDown size={14} color="#8a8fa3" />
            </div>
            {showDropdown && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e8eaf0', borderRadius: 12, boxShadow: '0 8px 24px rgba(20,23,40,.12)', minWidth: 200, zIndex: 50, overflow: 'hidden' }}>
                {sprints.map((s, i) => (
                  <div key={s.id} onClick={() => { setSelectedSprint(s); setShowDropdown(false) }}
                    style={{ padding: '11px 16px', cursor: 'pointer', background: selectedSprint?.id === s.id ? '#f0f4ff' : '#fff', fontWeight: 700, fontSize: 13.5, borderBottom: i < sprints.length - 1 ? '1px solid #f3f4f8' : 'none' }}>
                    {s.name}
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8a8fa3', marginLeft: 8 }}>{s.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '26px 34px 36px' }}>
          {(!burndown || burndown.byTask.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8a8fa3' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Chưa có dữ liệu burndown</div>
              <div style={{ fontSize: 14, marginTop: 6 }}>Sprint cần có tasks và ngày bắt đầu/kết thúc</div>
            </div>
          ) : (
            <>
              <section style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 18, padding: '24px 26px 20px', boxShadow: '0 1px 3px rgba(20,23,40,.04)', marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 18 }}>
                  <div>
                    <h2 style={{ margin: '0 0 5px', fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>
                      {mode === 'task' ? 'Tiến độ theo số Task' : 'Tiến độ theo Story Points'}
                    </h2>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#8a8fa3' }}>
                      {sprint?.name} · {sprint?.startDate ?? '—'} – {sprint?.endDate ?? '—'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 0, borderTop: '3px dashed #2563eb', display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#5b5f78' }}>Ideal</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 3, background: '#ef4444', borderRadius: 3, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#5b5f78' }}>Thực tế</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: 380, position: 'relative' }}>
                  <canvas ref={canvasRef} />
                </div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
                {[
                  { label: 'Tổng', value: total, unit: mode === 'task' ? 'tasks' : 'pts', accent: '#2563eb', iconBg: '#e4ecfd', icon: '📋' },
                  { label: 'Hoàn thành', value: done, unit: mode === 'task' ? 'tasks' : 'pts', accent: '#16a34a', iconBg: '#e7f6ec', icon: '✅' },
                  { label: 'Còn lại', value: total - done, unit: mode === 'task' ? 'tasks' : 'pts', accent: '#ef4444', iconBg: '#fde8e8', icon: '⏳' },
                  { label: 'Hoàn thành', value: total > 0 ? Math.round(done / total * 100) : 0, unit: '%', accent: '#d97706', iconBg: '#fdf0d9', icon: '📊' },
                ].map(s => (
                  <div key={s.label + s.unit} style={{ background: '#fff', border: '1px solid #edeef3', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 3px rgba(20,23,40,.04)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.accent }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#8a8fa3' }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.2px', lineHeight: 1, color: s.accent }}>{s.value}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#a0a4b8' }}>{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
