export const DEMO_USER = {
  id: 'demo',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: null,
}

// Returns ISO strings for created_at and updated_at relative to the current week.
// weeksBack: how many weeks ago; dayInWeek: 0=Mon … 6=Sun; stageDays: time spent before stage update.
function jobDate(weeksBack, dayInWeek = 0, stageDays = 0) {
  const d = new Date()
  const todayDay = d.getDay()
  const toMonday = todayDay === 0 ? 6 : todayDay - 1
  d.setDate(d.getDate() - toMonday - weeksBack * 7 + dayInWeek)
  d.setHours(10, 0, 0, 0)
  const created_at = d.toISOString()
  const u = new Date(d)
  u.setDate(u.getDate() + stageDays)
  return { created_at, updated_at: u.toISOString() }
}

const SEED = [
  // Week 0 — current week
  { company: 'Stripe',      role: 'Senior Frontend Engineer',  stage: 'Applied',      salary: '$160k–$200k', notes: 'Strong product culture, great infra challenges',      link: '', ...jobDate(0, 0, 0)  },
  // Week 1
  { company: 'Figma',       role: 'Software Engineer II',      stage: 'Applied',      salary: '$150k–$180k', notes: '',                                                     link: '', ...jobDate(1, 1, 0)  },
  { company: 'Notion',      role: 'Full Stack Engineer',        stage: 'Phone Screen', salary: '$140k–$170k', notes: 'Recruiter intro went well — technical call next week',  link: '', ...jobDate(1, 3, 4)  },
  { company: 'Linear',      role: 'Frontend Engineer',          stage: 'Applied',      salary: '$155k–$185k', notes: '',                                                     link: '', ...jobDate(1, 5, 0)  },
  // Week 2
  { company: 'Vercel',      role: 'Software Engineer',          stage: 'Interview',    salary: '$145k–$175k', notes: 'Cleared technical round — system design pending',      link: '', ...jobDate(2, 2, 10) },
  { company: 'Planetscale', role: 'Frontend Engineer',          stage: 'Rejected',     salary: '$130k–$160k', notes: 'No response after two follow-ups',                     link: '', ...jobDate(2, 4, 6)  },
  // Week 3
  { company: 'GitHub',      role: 'Senior Software Engineer',   stage: 'Interview',    salary: '$170k–$210k', notes: 'Final round: coding + system design + bar raiser',     link: '', ...jobDate(3, 1, 11) },
  { company: 'Tailscale',   role: 'Software Engineer',          stage: 'Phone Screen', salary: '$140k–$165k', notes: 'Async video interview submitted, awaiting review',      link: '', ...jobDate(3, 4, 3)  },
  // Week 4
  { company: 'Retool',      role: 'Full Stack Engineer',        stage: 'Offer',        salary: '$165k + equity', notes: 'Offer received — evaluating comp package',          link: '', ...jobDate(4, 2, 18) },
  { company: 'Loom',        role: 'React Developer',            stage: 'Rejected',     salary: '$120k–$145k', notes: 'Rejected after initial phone screen',                  link: '', ...jobDate(4, 5, 7)  },
  // Week 5
  { company: 'Supabase',    role: 'Frontend Engineer',          stage: 'Interview',    salary: '$140k–$170k', notes: 'Two rounds done — one final round remaining',          link: '', ...jobDate(5, 1, 9)  },
  { company: 'Railway',     role: 'Software Engineer',          stage: 'Rejected',     salary: '$135k–$160k', notes: 'Position filled internally',                           link: '', ...jobDate(5, 3, 5)  },
  { company: 'Resend',      role: 'Product Engineer',           stage: 'Applied',      salary: '$135k–$160k', notes: 'Warm intro through a friend at the company',           link: '', ...jobDate(5, 5, 0)  },
  // Week 6
  { company: 'Render',      role: 'Full Stack Engineer',        stage: 'Applied',      salary: '$130k–$155k', notes: '',                                                     link: '', ...jobDate(6, 2, 0)  },
  { company: 'Fly.io',      role: 'Frontend Engineer',          stage: 'Phone Screen', salary: '$145k–$175k', notes: 'Engineering manager call done — technical next',       link: '', ...jobDate(6, 4, 4)  },
  // Week 7
  { company: 'Clerk',       role: 'Software Engineer',          stage: 'Offer',        salary: '$155k + equity', notes: 'Competing offer — negotiating total comp',          link: '', ...jobDate(7, 1, 20) },
  { company: 'WorkOS',      role: 'Senior Engineer',            stage: 'Interview',    salary: '$160k–$195k', notes: 'Bar raiser round scheduled for next week',             link: '', ...jobDate(7, 4, 8)  },
  // Week 8
  { company: 'Neon',        role: 'Frontend Engineer',          stage: 'Rejected',     salary: '$130k–$155k', notes: 'Values misalignment surfaced in final round',          link: '', ...jobDate(8, 2, 6)  },
  { company: 'Turso',       role: 'Full Stack Engineer',        stage: 'Applied',      salary: '$140k–$165k', notes: 'Applied via referral from a former colleague',         link: '', ...jobDate(8, 5, 0)  },
  // Week 9
  { company: 'Unkey',       role: 'Software Engineer',          stage: 'Rejected',     salary: '$125k–$150k', notes: 'Role closed before interview process began',           link: '', ...jobDate(9, 3, 5)  },
]

let _jobs = null

export function resetDemoJobs() {
  _jobs = SEED.map(s => ({ ...s, id: crypto.randomUUID(), user_id: 'demo' }))
}

function getJobs() {
  if (!_jobs) resetDemoJobs()
  return _jobs
}

export const demoApi = {
  getJobs: () =>
    Promise.resolve([...getJobs()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))),

  createJob: (data) => {
    const now = new Date().toISOString()
    const job = {
      id: crypto.randomUUID(),
      user_id: 'demo',
      company: data.company ?? '',
      role: data.role ?? '',
      salary: data.salary ?? '',
      stage: data.stage ?? 'Applied',
      notes: data.notes ?? '',
      link: data.link ?? '',
      created_at: now,
      updated_at: now,
    }
    _jobs = [...getJobs(), job]
    return Promise.resolve(job)
  },

  updateJob: (id, data) => {
    const existing = getJobs().find(j => j.id === id)
    const updated = { ...existing, ...data, id, updated_at: new Date().toISOString() }
    _jobs = getJobs().map(j => j.id === id ? updated : j)
    return Promise.resolve(updated)
  },

  deleteJob: (id) => {
    _jobs = getJobs().filter(j => j.id !== id)
    return Promise.resolve(null)
  },

  importJobs: (rows) => {
    const now = new Date().toISOString()
    const inserted = rows.map(r => ({
      id: crypto.randomUUID(),
      user_id: 'demo',
      company: r.company ?? '',
      role: r.role ?? '',
      salary: r.salary ?? '',
      stage: r.stage ?? 'Applied',
      notes: r.notes ?? '',
      link: r.link ?? '',
      created_at: now,
      updated_at: now,
    }))
    _jobs = [...getJobs(), ...inserted]
    return Promise.resolve(inserted)
  },
}

export function computeDemoStats(jobs) {
  const total = jobs.length
  const active = jobs.filter(j => j.stage !== 'Rejected').length
  const responded = jobs.filter(j => !['Applied', 'Rejected'].includes(j.stage)).length
  const offers = jobs.filter(j => j.stage === 'Offer').length

  const STAGES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected']
  const byStage = STAGES.map(stage => {
    const stageJobs = jobs.filter(j => j.stage === stage)
    const count = stageJobs.length
    const avgDays = count
      ? Math.round(stageJobs.reduce((sum, j) => sum + (new Date(j.updated_at) - new Date(j.created_at)) / 86400000, 0) / count)
      : 0
    return { stage, count, avg_days: avgDays }
  })

  // Build 10 weekly buckets starting from Monday of each week
  const now = new Date()
  const todayDay = now.getDay()
  const toMonday = todayDay === 0 ? 6 : todayDay - 1
  const currentWeekMon = new Date(now)
  currentWeekMon.setDate(currentWeekMon.getDate() - toMonday)
  currentWeekMon.setHours(0, 0, 0, 0)

  const weekly = []
  for (let i = 9; i >= 0; i--) {
    const weekMon = new Date(currentWeekMon)
    weekMon.setDate(weekMon.getDate() - i * 7)
    const weekEnd = new Date(weekMon)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const count = jobs.filter(j => {
      const d = new Date(j.created_at)
      return d >= weekMon && d < weekEnd
    }).length

    const label = `${weekMon.toLocaleDateString('en-US', { month: 'short' })} ${String(weekMon.getDate()).padStart(2, '0')}`
    weekly.push({ week: label, count })
  }

  return {
    total,
    active,
    responseRate: total ? Math.round((responded / total) * 100) : 0,
    offerRate: total ? Math.round((offers / total) * 100) : 0,
    byStage,
    weekly,
  }
}
