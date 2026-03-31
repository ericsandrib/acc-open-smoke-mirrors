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

export function ActionsTable() {
  const { journeys } = useServicing()
  const navigate = useNavigate()

  const rows = journeys.flatMap((journey) =>
    journey.actions.map((action) => ({
      ...action,
      journeyName: journey.relationshipName,
      journeyId: journey.id,
    })),
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Action</TableHead>
          <TableHead>Journey</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Tasks Complete</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const complete = row.tasks.filter((t) => t.status === 'complete').length
          return (
            <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.journeyId}`)}>
              <TableCell className="font-medium">{row.title}</TableCell>
              <TableCell>{row.journeyName}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-right">
                {complete}/{row.tasks.length}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
