const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
