import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkflowProvider } from '@/stores/workflowStore'
import { ServicingProvider } from '@/stores/servicingStore'
import { ThemeProvider } from '@/stores/themeStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { WizardPage } from '@/pages/WizardPage'
import { WorkflowPage } from '@/pages/WorkflowPage'
import { ServicingPage } from '@/pages/ServicingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { JourneyDetailPage } from '@/pages/JourneyDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Toaster } from '@/components/ui/sonner'
import { AppPasswordGate } from '@/components/AppPasswordGate'
import { Agentation } from 'agentation'

export default function App() {
  return (
    <ThemeProvider>
      <AppPasswordGate>
        <WorkflowProvider>
          <ServicingProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/wizard" element={<WizardPage />} />
                <Route path="/workflow" element={<WorkflowPage />} />
                <Route path="/servicing" element={<ServicingPage />} />
                <Route path="/servicing/:journeyId" element={<JourneyDetailPage />} />
                <Route path="/servicing/:journeyId/action/:actionId" element={<JourneyDetailPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
            {import.meta.env.DEV && <Agentation />}
          </ServicingProvider>
        </WorkflowProvider>
        <Toaster />
      </AppPasswordGate>
    </ThemeProvider>
  )
}
