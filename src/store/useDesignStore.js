import { create } from 'zustand'
import { storage } from './storage'

const LEGACY_KEY = 'fd_designs_v1'
const AUTH_KEY = 'fd_auth_v1'
const makeKey = (username) =>
  username ? `fd_designs_v1_${username.toLowerCase()}` : null

// Bootstrap: read persisted auth so page refresh restores the right designs
const _persistedAuth = storage.get(AUTH_KEY, null)
const _startUsername = _persistedAuth?.role !== 'admin' ? _persistedAuth?.username : null

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)

const defaultRoom = {
  name: 'New Room',
  width: 450,
  height: 320,
  shape: 'RECT', // RECT | L
  color: '#f5f5f5',
  wallColor: '#d9d9d9',
  lighting: {
    intensity: 1.0,
    preset: 'Day' // Day | Night | Sunset
  }
}

// Load designs for a specific user.
// If the user has no designs yet AND legacy data exists, migrate it to them.
function loadForUser(username) {
  if (!username) return []
  const key = makeKey(username)
  const existing = storage.get(key, null)
  if (existing !== null) return existing

  // First time this user logs in — check for legacy unclaimed designs
  const legacy = storage.get(LEGACY_KEY, [])
  if (legacy.length > 0) {
    // Claim the legacy designs for this user and clear the legacy slot
    storage.set(key, legacy)
    storage.remove(LEGACY_KEY)
    return legacy
  }
  return []
}

export const useDesignStore = create((set, get) => ({
  designs: loadForUser(_startUsername),
  activeId: null,
  currentUsername: _startUsername,

  // Call this right after login / register
  switchUser: (username) => {
    const designs = loadForUser(username)
    set({ designs, activeId: designs[0]?.id ?? null, currentUsername: username })
  },

  // Call on logout
  clearUser: () => {
    set({ designs: [], activeId: null, currentUsername: null })
  },

  _save: (designs) => {
    const key = makeKey(get().currentUsername)
    if (key) storage.set(key, designs)
    set({ designs })
  },

  createDesign: (partial) => {
    const d = {
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: { ...defaultRoom, ...(partial?.room || {}) },
      items: partial?.items || [],
      notes: partial?.notes || ''
    }
    const designs = [d, ...get().designs]
    get()._save(designs)
    set({ activeId: d.id })
    return d
  },

  setActive: (id) => set({ activeId: id }),

  updateDesign: (id, patch) => {
    const designs = get().designs.map((d) =>
      d.id === id
        ? {
          ...d,
          ...patch,
          updatedAt: new Date().toISOString(),
          room: patch.room ? { ...d.room, ...patch.room } : d.room,
          items: patch.items ?? d.items
        }
        : d
    )
    get()._save(designs)
  },

  deleteDesign: (id) => {
    const designs = get().designs.filter((d) => d.id !== id)
    get()._save(designs)
    set({ activeId: designs[0]?.id ?? null })
  },

  duplicateDesign: (id) => {
    const d = get().designs.find((x) => x.id === id)
    if (!d) return null
    return get().createDesign({
      room: { ...d.room, name: d.room.name + ' (Copy)' },
      items: d.items.map((it) => ({ ...it, id: uid() })),
      notes: d.notes
    })
  }
}))
