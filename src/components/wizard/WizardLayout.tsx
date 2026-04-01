import { StepSidebar } from './StepSidebar'
import { TaskContent } from './TaskContent'
import { DetailSidebar } from './DetailSidebar'
import { WizardFooter } from './WizardFooter'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch } from 'lucide-react'

export function WizardLayout() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-sm font-semibold text-foreground">Account Opening</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate('/workflow')}>
            <GitBranch className="h-4 w-4 mr-1" />
            View Workflow
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <StepSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TaskContent />
          <WizardFooter />
        </div>
        <DetailSidebar />
      </div>
    </div>
  )
}
