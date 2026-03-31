import { StepSidebar } from './StepSidebar'
import { TaskContent } from './TaskContent'
import { DetailSidebar } from './DetailSidebar'
import { WizardFooter } from './WizardFooter'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { GitBranch } from 'lucide-react'

export function WizardLayout() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-semibold text-foreground">Account Opening Wizard</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/workflow')}>
          <GitBranch className="h-4 w-4 mr-1" />
          View Workflow
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <StepSidebar />
        <TaskContent />
        <DetailSidebar />
      </div>
      <WizardFooter />
    </div>
  )
}
