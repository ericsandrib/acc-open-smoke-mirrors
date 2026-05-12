import type { ChildTask, Task } from '@/types/workflow'

export function findChildTaskById(tasks: Task[], childId: string): ChildTask | undefined {
  for (const t of tasks) {
    if (!t.children?.length) continue
    const hit = t.children.find((c) => c.id === childId)
    if (hit) return hit
  }
  return undefined
}
