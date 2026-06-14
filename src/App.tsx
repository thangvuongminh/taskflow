import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Board from './pages/Board'
import Burndown from './pages/Burndown'
import MyTasks from './pages/MyTasks'
import Members from './pages/Members'
import Sprints from './pages/Sprints'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/register"  element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/projects"  element={<PrivateRoute><Projects /></PrivateRoute>} />
      <Route path="/board"     element={<PrivateRoute><Board /></PrivateRoute>} />
      <Route path="/burndown"  element={<PrivateRoute><Burndown /></PrivateRoute>} />
      <Route path="/my-tasks"  element={<PrivateRoute><MyTasks /></PrivateRoute>} />
      <Route path="/members"   element={<PrivateRoute><Members /></PrivateRoute>} />
      <Route path="/sprints"   element={<PrivateRoute><Sprints /></PrivateRoute>} />
      <Route path="*"          element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <AppRoutes />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
