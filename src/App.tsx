import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkflowProvider } from '@/stores/workflowStore'
import { ServicingProvider } from '@/stores/servicingStore'
import { ThemeProvider } from '@/stores/themeStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { WizardPage } from '@/pages/WizardPage'
import { WorkflowPage } from '@/pages/WorkflowPage'
import { ServicingPage } from '@/pages/ServicingPage'
import { JourneyDetailPage } from '@/pages/JourneyDetailPage'
import { Agentation } from 'agentation'

export default function App() {
  return (
    <ThemeProvider>
      <WorkflowProvider>
        <ServicingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/wizard" element={<WizardPage />} />
              <Route path="/workflow" element={<WorkflowPage />} />
              <Route path="/servicing" element={<ServicingPage />} />
              <Route path="/servicing/:journeyId" element={<JourneyDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          {import.meta.env.DEV && <Agentation />}
        </ServicingProvider>
      </WorkflowProvider>
    </ThemeProvider>
  )
}
