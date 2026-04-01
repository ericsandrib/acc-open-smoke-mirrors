import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useWorkflow } from '@/stores/workflowStore'
import { useServicing } from '@/stores/servicingStore'
import { relationships } from '@/data/relationships'
import { teamMembers } from '@/data/teamMembers'

interface ComposeDialogProps {
  onClose: () => void
}

const actionTypes = [
  { value: 'client-onboarding', label: 'Client Onboarding', enabled: true },
  { value: 'portfolio-rebalancing', label: 'Portfolio Rebalancing', enabled: false },
  { value: 'account-transfer', label: 'Account Transfer', enabled: false },
  { value: 'trust-administration', label: 'Trust Administration', enabled: false },
  { value: 'estate-planning', label: 'Estate Planning Review', enabled: false },
  { value: 'tax-loss-harvesting', label: 'Tax Loss Harvesting', enabled: false },
  { value: 'beneficiary-update', label: 'Beneficiary Update', enabled: false },
]

export function ComposeDialog({ onClose }: ComposeDialogProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const [journeyName, setJourneyName] = useState('')
  const [actionType, setActionType] = useState('')
  const [relationshipId, setRelationshipId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const { dispatch } = useWorkflow()
  const { currentLiveJourney, saveCurrentJourney } = useServicing()
  const navigate = useNavigate()

  const canSubmit = actionType === 'client-onboarding' && relationshipId !== ''

  function handleSubmit() {
    const relationship = relationships.find((r) => r.id === relationshipId)
    if (!relationship) return

    if (currentLiveJourney) {
      saveCurrentJourney(currentLiveJourney)
    }

    const name = journeyName || 'Client Onboarding'

    dispatch({
      type: 'INITIALIZE_FROM_RELATIONSHIP',
      relatedParties: relationship.relatedParties,
      financialAccounts: relationship.financialAccounts,
      clientInfo: {
        firstName: relationship.primaryContact.firstName,
        lastName: relationship.primaryContact.lastName,
        email: relationship.primaryContact.email,
        phone: relationship.primaryContact.phone,
        dob: relationship.primaryContact.dob ?? '',
        clientType: relationship.primaryContact.clientType ?? '',
      },
      journeyName: name,
      assignedTo: assignedTo || undefined,
    })
    toast.success(`Journey "${name}" created for ${relationship.name}`)
    navigate('/wizard')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-250"
        style={{ backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)' }}
        onClick={handleClose}
      />

      {/* Slide-out panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-[460px] bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Journey</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label>Journey Name</Label>
            <Input
              value={journeyName}
              onChange={(e) => setJourneyName(e.target.value)}
              placeholder="e.g. Smith Family Onboarding"
            />
          </div>

          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select an action..." />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((action) => (
                  <SelectItem
                    key={action.value}
                    value={action.value}
                    disabled={!action.enabled}
                  >
                    <span className="flex items-center gap-2">
                      {action.label}
                      {!action.enabled && (
                        <Badge variant="secondary" className="text-[10px]">
                          Coming soon
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={relationshipId} onValueChange={setRelationshipId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a relationship..." />
              </SelectTrigger>
              <SelectContent>
                {relationships.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((tm) => (
                  <SelectItem key={tm.id} value={tm.name}>
                    {tm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            Start Onboarding
          </Button>
        </div>
      </div>
    </>
  )
}
