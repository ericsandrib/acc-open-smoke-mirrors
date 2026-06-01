import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ClaimTaskDialogProps {
  open: boolean
  taskTitle?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** "Claim this Task?" confirmation shown when an advisor clicks Begin on an unassigned task. */
export function ClaimTaskDialog({ open, taskTitle, onOpenChange, onConfirm }: ClaimTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim this Task?</DialogTitle>
          <DialogDescription>
            {taskTitle ? (
              <>Claiming <span className="font-medium text-foreground">{taskTitle}</span> will make you the Task Owner and change the Status to In Progress.</>
            ) : (
              <>Claiming this Task will make you the Task Owner and change the Status to In Progress.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Yes, Claim Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
