import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export interface ListParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  [key: string]: string | number | boolean | undefined
}

export function useCrudList<T = Record<string, unknown>>(resource: string, params: ListParams = {}) {
  return useQuery<Paginated<T>>({
    queryKey: [resource, 'list', params],
    queryFn: async () => (await apiClient.get(`/${resource}`, { params })).data,
    placeholderData: (prev) => prev,
  })
}

export function useCrudAll<T = Record<string, unknown>>(resource: string, params: ListParams = {}) {
  return useQuery<T[]>({
    queryKey: [resource, 'all', params],
    queryFn: async () => (await apiClient.get(`/${resource}`, { params: { per_page: 100, ...params } })).data.data,
  })
}

export function useCrudItem<T = Record<string, unknown>>(resource: string, id: number | string | undefined) {
  return useQuery<{ data: T }>({
    queryKey: [resource, 'item', id],
    queryFn: async () => (await apiClient.get(`/${resource}/${id}`)).data,
    enabled: id !== undefined,
  })
}

export function useCrudCreate(resource: string, options?: { label?: string }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await apiClient.post(`/${resource}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
      toast.success(`${options?.label ?? 'Record'} created`)
    },
    onError: (error) => toast.error(extractError(error)),
  })
}

export function useCrudUpdate(resource: string, options?: { label?: string }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload: Record<string, unknown> }) =>
      (await apiClient.put(`/${resource}/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
      toast.success(`${options?.label ?? 'Record'} updated`)
    },
    onError: (error) => toast.error(extractError(error)),
  })
}

export function useCrudDelete(resource: string, options?: { label?: string }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => (await apiClient.delete(`/${resource}/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
      toast.success(`${options?.label ?? 'Record'} deleted`)
    },
    onError: (error) => toast.error(extractError(error)),
  })
}

export function extractError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    const errors = response?.data?.errors
    if (errors) {
      const first = Object.values(errors)[0]
      if (first?.[0]) return first[0]
    }
    if (response?.data?.message) return response.data.message
  }
  return 'Something went wrong. Please try again.'
}
