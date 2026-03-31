import { useServicing } from '@/stores/servicingStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from './StatusBadge'

export function TasksTable() {
  const { journeys } = useServicing()

  const rows = journeys.flatMap((journey) =>
    journey.actions.flatMap((action) =>
      action.tasks.map((task) => ({
        ...task,
        actionTitle: action.title,
        journeyName: journey.relationshipName,
      })),
    ),
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Task</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Journey</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned To</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>{row.actionTitle}</TableCell>
            <TableCell>{row.journeyName}</TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>{row.assignedTo}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
