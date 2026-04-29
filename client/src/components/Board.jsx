import { useState, useRef } from 'react'
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

function exportCSV(jobs) {
  const header = 'company,role,salary,stage,notes,link'
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = jobs.map(j => [j.company, j.role, j.salary, j.stage, j.notes, j.link].map(escape).join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'pipeline-jobs.csv' })
  a.click()
  URL.revokeObjectURL(a.href)
}

const FIELD_ALIASES = {
  company: ['company', 'company name', 'employer', 'organization'],
  role:    ['role', 'position', 'position title', 'job title', 'title', 'job'],
  stage:   ['stage', 'status', 'application status'],
  salary:  ['salary', 'compensation', 'pay', 'wage'],
  notes:   ['notes', 'note', 'comments'],
  link:    ['link', 'url', 'job link', 'job url', 'application link'],
}

function parseLine(line) {
  const cols = []
  let cur = '', inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { if (inQuote && line[i + 1] === '"') { cur += '"'; i++ } else inQuote = !inQuote }
    else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cols.push(cur.trim())
  return cols
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)

  // Find the first row that has recognisable company + role columns
  let headerIdx = -1, colMap = {}
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cols = parseLine(lines[i]).map(h => h.toLowerCase().replace(/"/g, '').trim())
    const map = {}
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      const idx = cols.findIndex(h => aliases.includes(h))
      if (idx !== -1) map[field] = idx
    }
    if (map.company !== undefined && map.role !== undefined) {
      headerIdx = i; colMap = map; break
    }
  }

  if (headerIdx === -1) return []

  return lines.slice(headerIdx + 1).map(line => {
    const cols = parseLine(line)
    return {
      company: cols[colMap.company] ?? '',
      role:    cols[colMap.role]    ?? '',
      stage:   cols[colMap.stage]   ?? '',
      salary:  cols[colMap.salary]  ?? '',
      notes:   cols[colMap.notes]   ?? '',
      link:    cols[colMap.link]    ?? '',
    }
  }).filter(r => r.company && r.role)
}

export default function Board({ jobs, onAdd, onUpdate, onDelete, onMove, onImport }) {
  const [activeJob, setActiveJob] = useState(null)
  const [overId, setOverId] = useState(null)
  const [modalState, setModalState] = useState({ open: false, job: null })
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

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

  async function handleImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const rows = parseCSV(text)
    if (!rows.length) return
    setImporting(true)
    try { await onImport(rows) } finally { setImporting(false) }
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
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current.click()}
            disabled={importing}
            className="inline-flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-600 dark:text-gray-300 text-sm font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <button
            onClick={() => exportCSV(jobs)}
            disabled={jobs.length === 0}
            className="inline-flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-600 dark:text-gray-300 text-sm font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Job
          </button>
        </div>
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
