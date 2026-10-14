import type { SafetyEvent, TrustedContact } from './types'

const REPORTS_KEY = 'sinaliza:reports'
const CONTACTS_KEY = 'sinaliza:contacts'

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export const getLocalReports = () => read<SafetyEvent[]>(REPORTS_KEY, [])
export const saveLocalReports = (reports: SafetyEvent[]) => localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
export const getContacts = () => read<TrustedContact[]>(CONTACTS_KEY, [])
export const saveContacts = (contacts: TrustedContact[]) => localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts))
