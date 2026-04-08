import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export default function JobCard({ job, isDragging, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isActiveDragging } =
    useDraggable({ id: job.id })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const dragging = isDragging || isActiveDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none group transition-shadow ${
        dragging ? 'opacity-40 shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{job.company}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.role}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit(job) }}
            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded"
            aria-label="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
            </svg>
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(job.id) }}
            className="text-gray-400 hover:text-red-500 p-1 rounded"
            aria-label="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {job.salary && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{job.salary}</p>
      )}
      {job.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{job.notes}</p>
      )}
      {job.link && (
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className="inline-block text-xs text-indigo-500 hover:underline mt-1 truncate max-w-full"
        >
          View posting
        </a>
      )}
    </div>
  )
}
