import { useNavigate } from 'react-router-dom'
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

export function JourneysTable() {
  const { journeys } = useServicing()
  const navigate = useNavigate()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Journey</TableHead>
          <TableHead>Relationship</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {journeys.map((journey) => {
          const totalTasks = journey.actions.reduce(
            (sum, a) => sum + a.tasks.length,
            0,
          )
          const completeTasks = journey.actions.reduce(
            (sum, a) => sum + a.tasks.filter((t) => t.status === 'complete').length,
            0,
          )
          return (
            <TableRow key={journey.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${journey.id}`)}>
              <TableCell className="font-medium">
                {journey.id === 'live-current' ? (
                  <span className="flex items-center gap-2">
                    {journey.name}
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  </span>
                ) : (
                  journey.name
                )}
              </TableCell>
              <TableCell>{journey.relationshipName}</TableCell>
              <TableCell>
                <StatusBadge status={journey.status} />
              </TableCell>
              <TableCell>{journey.assignedTo}</TableCell>
              <TableCell>{journey.createdAt}</TableCell>
              <TableCell className="text-right">
                {completeTasks}/{totalTasks} tasks
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
