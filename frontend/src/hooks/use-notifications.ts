import { useEffect, useState } from 'react'

import { useApiQuery } from '@/hooks/use-crud'
import { activityKey, type ActivityItem } from '@/components/dashboard/ActivityFeed'

const READ_STORAGE_KEY = 'tms.notifications.read'

function loadRead(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function saveRead(read: Set<string>) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...read]))
}

export function useNotifications() {
  const { data, isLoading } = useApiQuery<ActivityItem[]>('/dashboard/upcoming-activities')
  const [read, setRead] = useState<Set<string>>(() => loadRead())

  useEffect(() => saveRead(read), [read])

  const items = data ?? []
  const unreadCount = items.filter((item, idx) => !read.has(activityKey(item, idx))).length

  function markRead(key: string) {
    setRead((prev) => new Set(prev).add(key))
  }

  function markAllRead() {
    setRead(new Set(items.map((item, idx) => activityKey(item, idx))))
  }

  return { items, isLoading, read, unreadCount, markRead, markAllRead }
}
