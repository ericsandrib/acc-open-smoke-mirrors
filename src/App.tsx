import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkflowProvider } from '@/stores/workflowStore'
import { WizardPage } from '@/pages/WizardPage'
import { WorkflowPage } from '@/pages/WorkflowPage'

export default function App() {
  return (
    <WorkflowProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="*" element={<Navigate to="/wizard" replace />} />
        </Routes>
      </BrowserRouter>
    </WorkflowProvider>
  )
}
