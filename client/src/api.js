const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getJobs:    ()           => request('/jobs'),
  createJob:  (data)       => request('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob:  (id, data)   => request(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteJob:  (id)         => request(`/jobs/${id}`, { method: 'DELETE' }),
}
