import { create } from 'zustand'
import { storage } from './storage'
import { useDesignStore } from './useDesignStore'

const AUTH_KEY = 'fd_auth_v1'
const USERS_KEY = 'fd_users_v1'

// Hardcoded admin — not stored in registry, not removable
const ADMIN = {
  username: 'admin',
  password: 'admin2024',
  name: 'Administrator',
  role: 'admin'
}

// Legacy designer user — always present as a fallback
const LEGACY_DESIGNER = {
  username: 'designer',
  password: 'designer123',
  name: 'Store Designer',
  role: 'user',
  joinedAt: '2024-01-01T00:00:00.000Z'
}

function getUsers() {
  const users = storage.get(USERS_KEY, [])
  // Ensure legacy designer is always in the list
  if (!users.find((u) => u.username === 'designer')) {
    users.unshift(LEGACY_DESIGNER)
    storage.set(USERS_KEY, users)
  }
  return users
}

export const useAuth = create((set) => ({
  user: storage.get(AUTH_KEY, null),
  isAuthed: !!storage.get(AUTH_KEY, null),

  login: ({ username, password }) => {
    // Check admin first
    if (username.trim() === ADMIN.username && password === ADMIN.password) {
      const user = { username: ADMIN.username, name: ADMIN.name, role: 'admin' }
      storage.set(AUTH_KEY, user)
      // Admin has no designs of their own — clear the design store
      useDesignStore.getState().clearUser()
      set({ user, isAuthed: true })
      return { ok: true }
    }

    // Check registered users (includes legacy designer)
    const users = getUsers()
    const u = users.find(
      (x) => x.username === username.trim() && x.password === password
    )
    if (!u) return { ok: false, message: 'Invalid username or password' }

    // Update lastLoginAt
    const updated = users.map((x) =>
      x.username === u.username
        ? { ...x, lastLoginAt: new Date().toISOString() }
        : x
    )
    storage.set(USERS_KEY, updated)

    const user = { username: u.username, name: u.name, role: u.role || 'user' }
    storage.set(AUTH_KEY, user)
    // Load this user's private designs
    useDesignStore.getState().switchUser(u.username)
    set({ user, isAuthed: true })
    return { ok: true }
  },

  register: ({ username, password, name }) => {
    const trimmed = username.trim()
    if (!trimmed || !password || !name.trim()) {
      return { ok: false, message: 'All fields are required' }
    }
    if (trimmed === 'admin') {
      return { ok: false, message: 'That username is reserved' }
    }
    if (password.length < 6) {
      return { ok: false, message: 'Password must be at least 6 characters' }
    }

    const users = getUsers()
    if (users.find((u) => u.username === trimmed)) {
      return { ok: false, message: 'Username already taken' }
    }

    const newUser = {
      username: trimmed,
      password,
      name: name.trim(),
      role: 'user',
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }
    storage.set(USERS_KEY, [...users, newUser])

    const user = { username: newUser.username, name: newUser.name, role: 'user' }
    storage.set(AUTH_KEY, user)
    // Load (empty) designs for the new user
    useDesignStore.getState().switchUser(newUser.username)
    set({ user, isAuthed: true })
    return { ok: true }
  },

  logout: () => {
    storage.remove(AUTH_KEY)
    // Clear design store so no designs leak between sessions
    useDesignStore.getState().clearUser()
    set({ user: null, isAuthed: false })
  },

  // Returns all registered users (for admin)
  getRegisteredUsers: () => getUsers()
}))
