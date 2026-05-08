import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkflowProvider } from '@/stores/workflowStore'
import { ServicingProvider } from '@/stores/servicingStore'
import { ThemeProvider } from '@/stores/themeStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { WizardPage } from '@/pages/WizardPage'
import { WorkflowPage } from '@/pages/WorkflowPage'
import { ServicingPage } from '@/pages/ServicingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { OnboardingJourneyDetailPage } from '@/pages/OnboardingJourneyDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TestsIndexPage } from '@/pages/tests/TestsIndexPage'
import { ProgressIndicatorTestPage } from '@/pages/tests/ProgressIndicatorTestPage'
import { Toaster } from '@/components/ui/sonner'
import { AppPasswordGate } from '@/components/AppPasswordGate'
import { OpenAccountsVariantAndFocusProvider } from '@/components/wizard/openAccountsVariantContext'

export default function App() {
  return (
    <ThemeProvider>
      <AppPasswordGate>
        <WorkflowProvider>
          <ServicingProvider>
            <OpenAccountsVariantAndFocusProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/servicing" element={<ServicingPage />} />
                  <Route path="/servicing/:journeyId" element={<WizardPage />} />
                  <Route path="/wizard" element={<Navigate to="/onboarding" replace />} />
                  <Route path="/workflow" element={<WorkflowPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/onboarding/:journeyId" element={<OnboardingJourneyDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/tests" element={<TestsIndexPage />} />
                  <Route path="/tests/progress-indicator" element={<ProgressIndicatorTestPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </OpenAccountsVariantAndFocusProvider>
          </ServicingProvider>
        </WorkflowProvider>
        <Toaster />
      </AppPasswordGate>
    </ThemeProvider>
  )
}
