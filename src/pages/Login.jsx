import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Login() {
  const nav = useNavigate()
  const { login, register, isAuthed, user } = useAuth()
  const [tab, setTab] = useState('login')

  // Login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Register state
  const [regName, setRegName] = useState('')
  const [regUser, setRegUser] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState(false)

  if (isAuthed) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setLoginError('')
    const res = login({ username, password })
    if (!res.ok) setLoginError(res.message)
    else nav(username.trim() === 'admin' ? '/admin' : '/')
  }

  const handleRegister = (e) => {
    e.preventDefault()
    setRegError('')
    if (regPass !== regConfirm) {
      setRegError('Passwords do not match')
      return
    }
    const res = register({ username: regUser, password: regPass, name: regName })
    if (!res.ok) setRegError(res.message)
    else {
      setRegSuccess(true)
      setTimeout(() => nav('/'), 800)
    }
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <div className="authHeader">
          <div className="brandMark">FD</div>
          <div>
            <div className="authTitle">Furniture Designer</div>
            <div className="authSub">2D + 3D Room Planner</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabSwitch">
          <button
            className={'tabBtn ' + (tab === 'login' ? 'tabBtnActive' : '')}
            onClick={() => { setTab('login'); setLoginError(''); }}
          >
            Sign In
          </button>
          <button
            className={'tabBtn ' + (tab === 'register' ? 'tabBtnActive' : '')}
            onClick={() => { setTab('register'); setRegError(''); }}
          >
            Register
          </button>
        </div>

        {tab === 'login' && (
          <form className="authForm" onSubmit={handleLogin}>
            <label className="field">
              <span>Username</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </label>
            {loginError && <div className="alert">{loginError}</div>}
            <button className="btn btnPrimary authSubmit" type="submit">
              Sign In →
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form className="authForm" onSubmit={handleRegister}>
            <label className="field">
              <span>Full Name</span>
              <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your name" />
            </label>
            <label className="field">
              <span>Username</span>
              <input value={regUser} onChange={(e) => setRegUser(e.target.value)} placeholder="Choose a username" />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                placeholder="Min. 6 characters"
              />
            </label>
            <label className="field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </label>
            {regError && <div className="alert">{regError}</div>}
            {regSuccess && (
              <div className="alertSuccess">✅ Account created! Redirecting…</div>
            )}
            <button className="btn btnPrimary authSubmit" type="submit">
              Create Account →
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
