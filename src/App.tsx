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
import { RelationshipsPage } from '@/pages/RelationshipsPage'
import { RelationshipDetailPage } from '@/pages/RelationshipDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { OrionGapsPage } from '@/pages/OrionGapsPage'
import { WorkflowV2Page } from '@/pages/WorkflowV2Page'
import { WorkflowV1ArchivePage } from '@/pages/WorkflowV1ArchivePage'
import { RulesExplorerPage } from '@/pages/RulesExplorerPage'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { Toaster } from '@/components/ui/sonner'
import { AppPasswordGate } from '@/components/AppPasswordGate'
import {
  ConfigOverlayProvider,
  ConfigOverlayToggle,
  ConfigCapturePanel,
} from '@/components/config-overlay'
import { PGliteProvider } from '@/db/PGliteProvider'

export default function App() {
  return (
    <ThemeProvider>
      <AppPasswordGate>
        <PGliteProvider>
        <ConfigOverlayProvider>
          <WorkflowProvider>
            <ServicingProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/wizard" element={<WizardPage />} />
                  <Route path="/workflow" element={<WorkflowV2Page />} />
                  <Route path="/workflow-v1" element={<WorkflowV1ArchivePage />} />
                  <Route path="/workflow-legacy" element={<WorkflowPage />} />
                  <Route path="/rules" element={<RulesExplorerPage />} />
                  <Route path="/queue" element={<ReviewQueuePage />} />
                  <Route path="/servicing" element={<ServicingPage />} />
                  <Route path="/servicing/:journeyId" element={<JourneyDetailPage />} />
                  <Route path="/servicing/:journeyId/action/:actionId" element={<JourneyDetailPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/relationships" element={<RelationshipsPage />} />
                  <Route path="/relationships/:id" element={<RelationshipDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/orion-gaps" element={<OrionGapsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ServicingProvider>
          </WorkflowProvider>
          <ConfigOverlayToggle />
          <ConfigCapturePanel />
        </ConfigOverlayProvider>
        </PGliteProvider>
        <Toaster />
      </AppPasswordGate>
    </ThemeProvider>
  )
}
