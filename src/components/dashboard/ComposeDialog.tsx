import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useWorkflow } from '@/stores/workflowStore'
import { relationships } from '@/data/relationships'

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
  const [minimized, setMinimized] = useState(false)
  const [actionType, setActionType] = useState('')
  const [relationshipId, setRelationshipId] = useState('')
  const { dispatch } = useWorkflow()
  const navigate = useNavigate()

  const canSubmit = actionType === 'client-onboarding' && relationshipId !== ''

  function handleSubmit() {
    const relationship = relationships.find((r) => r.id === relationshipId)
    if (!relationship) return

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
    })
    navigate('/wizard')
  }

  return (
    <div className="fixed bottom-0 right-6 z-50 flex w-[420px] flex-col rounded-t-lg border border-border bg-card shadow-xl">
      {/* Title bar */}
      <button
        onClick={() => setMinimized((m) => !m)}
        className="flex items-center justify-between rounded-t-lg bg-primary px-4 py-2.5 text-primary-foreground"
      >
        <span className="text-sm font-medium">New Journey</span>
        <div className="flex items-center gap-1">
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              setMinimized((m) => !m)
            }}
            className="rounded p-0.5 hover:bg-primary-foreground/20"
          >
            <Minus className="h-4 w-4" />
          </span>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="rounded p-0.5 hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </span>
        </div>
      </button>

      {/* Body */}
      {!minimized && (
        <div className="space-y-4 p-4">
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

          {actionType === 'client-onboarding' && (
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
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            Start Onboarding
          </Button>
        </div>
      )}
    </div>
  )
}
