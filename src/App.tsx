import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkflowProvider } from '@/stores/workflowStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { WizardPage } from '@/pages/WizardPage'
import { WorkflowPage } from '@/pages/WorkflowPage'
import { Agentation } from 'agentation'

export default function App() {
  return (
    <WorkflowProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV && <Agentation />}
    </WorkflowProvider>
  )
}
