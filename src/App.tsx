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
import { TestClientFlowPage } from '@/pages/TestClientFlowPage'
import { AccountOpeningFundingPage } from '@/pages/AccountOpeningFundingPage'
import { FlowStepPlaceholderPage } from '@/pages/FlowStepPlaceholderPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Toaster } from '@/components/ui/sonner'
import { AppPasswordGate } from '@/components/AppPasswordGate'

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
                <Route path="/onboarding/flow" element={<TestClientFlowPage />} />
                <Route
                  path="/onboarding/flow/account-opening-funding"
                  element={<AccountOpeningFundingPage />}
                />
                <Route
                  path="/onboarding/flow/:stepSlug"
                  element={<FlowStepPlaceholderPage />}
                />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ServicingProvider>
        </WorkflowProvider>
        <Toaster />
      </AppPasswordGate>
    </ThemeProvider>
  )
}
