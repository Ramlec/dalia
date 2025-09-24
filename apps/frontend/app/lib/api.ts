const BASE_URL = (typeof window === 'undefined')
  ? process.env.VITE_API_URL || 'http://localhost:3000'
  : 'http://localhost:3000'

export interface User {
  id: number
  firstname: string
  lastname: string
}

export interface Sleep {
  id: number
  user_id: number
  date: string
  duration: string | null
  duration_min: number | null
  mean_hr: number | null
  bedtime: string | null
  waketime: string | null
  score: number | null
  bedtime_full: string | null
  waketime_full: string | null
}

export async function apiFetch<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export const fetchUsers = () => apiFetch<User[]>('/users')
export const fetchUser = (id: number) => apiFetch<User>(`/users/${id}`)
export const fetchUserSleeps = (id: number) => apiFetch<Sleep[] | { data: Sleep[] }>(`/users/${id}/sleeps`).then((d:any)=> Array.isArray(d)? d : d.data)
