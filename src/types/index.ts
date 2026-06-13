export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED'

export interface Member {
  id: string
  name: string
  initials: string
  role: string
  avatarGradient: string
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  storyPoints: number
  assigneeId: string
  projectName: string
  dueDate: string
  dueDateFull: string
  commentCount: number
  description?: string
  progress?: number
  labels: string[]
  sprintId: string
}

export interface Column {
  id: TaskStatus
  label: string
  dotColor: string
  tasks: Task[]
}

export interface BurndownPoint {
  date: string
  ideal: number
  actual: number | null
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  status: SprintStatus
  projectName: string
  totalTasks: number
  doneTasks: number
  totalPoints: number
  donePoints: number
  burndownByTask: BurndownPoint[]
  burndownByPoint: BurndownPoint[]
}
