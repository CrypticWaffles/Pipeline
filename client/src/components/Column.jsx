import { useDroppable } from '@dnd-kit/core'
import JobCard from './JobCard'

export default function Column({ stage, color, jobs, isOver, onEdit, onDelete }) {
  const { setNodeRef } = useDroppable({ id: stage })

  return (
    <div className="flex flex-col w-64 shrink-0 h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stage}</h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 overflow-y-auto rounded-lg p-2 transition-colors min-h-20 ${
          isOver
            ? 'bg-indigo-50 dark:bg-indigo-950 ring-2 ring-indigo-200 dark:ring-indigo-800'
            : 'bg-gray-100 dark:bg-gray-900'
        }`}
      >
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
