import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import Column from './Column'
import JobCard from './JobCard'
import JobModal from './JobModal'

export const STAGES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']

const STAGE_COLORS = {
  'Applied':      'bg-blue-500',
  'Phone Screen': 'bg-yellow-500',
  'Interview':    'bg-purple-500',
  'Offer':        'bg-green-500',
  'Rejected':     'bg-red-400',
}

export default function Board({ jobs, onAdd, onUpdate, onDelete, onMove }) {
  const [activeJob, setActiveJob] = useState(null)
  const [overId, setOverId] = useState(null)
  const [modalState, setModalState] = useState({ open: false, job: null })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart({ active }) {
    setActiveJob(jobs.find(j => j.id === active.id) ?? null)
  }

  function handleDragOver({ over }) {
    setOverId(over?.id ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveJob(null)
    setOverId(null)
    if (!over) return
    const targetStage = over.id
    const job = jobs.find(j => j.id === active.id)
    if (job && job.stage !== targetStage) {
      onMove(active.id, targetStage)
    }
  }

  function openAdd() { setModalState({ open: true, job: null }) }
  function openEdit(job) { setModalState({ open: true, job }) }
  function closeModal() { setModalState({ open: false, job: null }) }

  function handleSave(data) {
    if (modalState.job) {
      onUpdate({ ...modalState.job, ...data })
    } else {
      onAdd(data)
    }
    closeModal()
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Board</span>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Job
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 overflow-x-auto h-[calc(100vh-112px)]">
          {STAGES.map(stage => (
            <Column
              key={stage}
              stage={stage}
              color={STAGE_COLORS[stage]}
              jobs={jobs.filter(j => j.stage === stage)}
              isOver={overId === stage}
              onEdit={openEdit}
              onDelete={onDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <JobCard job={activeJob} isDragging onEdit={() => {}} onDelete={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalState.open && (
        <JobModal
          job={modalState.job}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </>
  )
}
