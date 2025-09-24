const getBaseUrl = () => {
  const isServer = typeof window === 'undefined'
  if (isServer) {
    // SSR: utiliser l'URL interne Docker (non exposée au client)
    return process.env.SERVER_API_URL || process.env.VITE_API_URL || 'http://backend:3000'
  }
  // Client: utiliser l'URL publique (localhost ou domaine)
  const publicEnv = (import.meta as any).env?.VITE_PUBLIC_API_URL as string | undefined
  if (publicEnv && publicEnv.length > 0) return publicEnv
  // Fallback: même hôte, port 3000
  return `${window.location.protocol}//${window.location.hostname}:3000`
}

const BASE_URL = getBaseUrl()

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

export function fetchUserSleeps(
  id: number,
  opts?: { dateFrom?: string; dateTo?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }
): Promise<Sleep[] | { data: Sleep[] }> {
  const params = new URLSearchParams()
  if (opts?.dateFrom) params.set('dateFrom', opts.dateFrom)
  if (opts?.dateTo) params.set('dateTo', opts.dateTo)
  if (opts?.page) params.set('page', String(opts.page))
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.sortBy) params.set('sortBy', opts.sortBy)
  if (opts?.sortOrder) params.set('sortOrder', opts.sortOrder)
  const qs = params.toString()
  const path = qs ? `/users/${id}/sleeps?${qs}` : `/users/${id}/sleeps`
  return apiFetch(path)
}
