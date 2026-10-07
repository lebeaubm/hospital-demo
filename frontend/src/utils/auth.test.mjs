import test, { afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import axios from 'axios'
import { decodeJWT, getUserFromToken, getUserInfo, isTokenUsable, restoreAuthSession } from './auth.js'
import { api, clearTokens, refreshAccessToken, setTokens } from '../api/client.js'

const now = Date.now()
const claims = { token_type: 'access', exp: Math.floor(now / 1000) + 3600, user_id: 7, email: 'demo@example.com', role: 'PATIENT' }
const token = (payload) => `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`
const validAccess = token(claims)
const validRefresh = token({ ...claims, token_type: 'refresh' })
const expiredAccess = token({ ...claims, exp: Math.floor(now / 1000) - 1 })

class MemoryStorage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}

const originalStorage = globalThis.localStorage
const originalWindow = globalThis.window
const originalApiAdapter = api.defaults.adapter
const originalAxiosAdapter = axios.defaults.adapter
let storage

beforeEach(() => {
  storage = new MemoryStorage()
  globalThis.localStorage = storage
  globalThis.window = { location: { href: '' } }
  // Every test request is mocked; unexpected requests fail instead of reaching a server.
  api.defaults.adapter = axios.defaults.adapter = async () => { throw new Error('Unexpected test request') }
})

afterEach(() => {
  globalThis.localStorage = originalStorage
  globalThis.window = originalWindow
  api.defaults.adapter = originalApiAdapter
  axios.defaults.adapter = originalAxiosAdapter
})

test('decodes Unicode claims and returns complete user information', () => {
  const unicodeToken = token({ ...claims, email: 'élodie@example.com', name: '李 Demo' })
  assert.equal(decodeJWT(unicodeToken).name, '李 Demo')
  assert.deepEqual(getUserFromToken(unicodeToken, now), { userId: 7, email: 'élodie@example.com', role: 'PATIENT' })
})

test('malformed tokens and non-object payloads never produce a user', () => {
  for (const value of [null, {}, '', 'onepart', 'two.parts', 'a.!.c', 'a.b.c.d', token(null), token([]), token('text')]) {
    assert.equal(decodeJWT(value), null)
    assert.equal(getUserFromToken(value, now), null)
  }
})

test('expiry is strict and requires a numeric finite future timestamp', () => {
  for (const exp of [undefined, null, '9999999999', Math.floor(now / 1000), Math.floor(now / 1000) - 1]) {
    assert.equal(isTokenUsable(token({ ...claims, exp }), 'access', now), false)
  }
  assert.equal(isTokenUsable(validAccess, 'access', now), true)
  assert.equal(getUserFromToken(expiredAccess, now), null)
  assert.equal(getUserFromToken(validRefresh, now), null)
})

test('missing user claims and unknown roles cannot restore authentication', () => {
  for (const changes of [{ user_id: null }, { user_id: 0 }, { user_id: '' }, { email: null }, { email: '' }, { role: undefined }, { role: 'SUPERUSER' }]) {
    assert.equal(getUserFromToken(token({ ...claims, ...changes }), now), null)
  }
})

test('Owner token restores an Owner user and can be stored at sign in', () => {
  const ownerClaims = { ...claims, role: 'OWNER' }
  const ownerAccess = token(ownerClaims)
  const ownerRefresh = token({ ...ownerClaims, token_type: 'refresh' })
  assert.deepEqual(getUserFromToken(ownerAccess, now), { userId: 7, email: 'demo@example.com', role: 'OWNER' })
  setTokens({ access: ownerAccess, refresh: ownerRefresh })
  assert.equal(storage.getItem('accessToken'), ownerAccess)
})

test('getUserInfo ignores stale stored user data when access claims are missing', async () => {
  storage.setItem('user', JSON.stringify({ role: 'ADMIN' }))
  storage.setItem('accessToken', token({ ...claims, role: undefined }))
  assert.equal(await getUserInfo(), null)
})

test('valid access restores its claims without refreshing or trusting stored user', async () => {
  storage.setItem('accessToken', validAccess)
  storage.setItem('user', JSON.stringify({ role: 'ADMIN', userId: 99 }))
  let requests = 0
  const user = await restoreAuthSession(storage, async () => { requests += 1 }, () => now)
  assert.deepEqual(user, { userId: 7, email: 'demo@example.com', role: 'PATIENT' })
  assert.equal(requests, 0)
  assert.deepEqual(JSON.parse(storage.getItem('user')), user)
})

test('expired or absent access is refreshed when a usable refresh token exists', async () => {
  for (const access of [expiredAccess, null]) {
    storage.setItem('refreshToken', validRefresh)
    if (access) storage.setItem('accessToken', access)
    else storage.removeItem('accessToken')
    const user = await restoreAuthSession(storage, async () => {
      storage.setItem('accessToken', validAccess)
      return validAccess
    }, () => now)
    assert.equal(user.role, 'PATIENT')
    assert.equal(storage.getItem('accessToken'), validAccess)
  }
})

test('expired or malformed refresh tokens clear all stale session data', async () => {
  for (const refresh of ['bad-token', token({ ...claims, token_type: 'refresh', exp: 1 })]) {
    storage.setItem('accessToken', expiredAccess)
    storage.setItem('refreshToken', refresh)
    storage.setItem('user', JSON.stringify({ role: 'ADMIN' }))
    assert.equal(await restoreAuthSession(storage, async () => { assert.fail('refresh should not run') }, () => now), null)
    for (const key of ['accessToken', 'refreshToken', 'user']) assert.equal(storage.getItem(key), null)
  }
})

test('missing access user information cannot be recovered from stale stored user', async () => {
  storage.setItem('accessToken', token({ ...claims, email: undefined }))
  storage.setItem('user', JSON.stringify({ userId: 7, email: 'old@example.com', role: 'ADMIN' }))
  assert.equal(await restoreAuthSession(storage, async () => { assert.fail('no refresh token') }, () => now), null)
  assert.equal(storage.getItem('user'), null)
})

test('rejected refresh clears session but a transient outage preserves usable refresh', async () => {
  for (const error of [{ response: { status: 401 } }, { code: 'ETIMEDOUT' }]) {
    storage.setItem('accessToken', expiredAccess)
    storage.setItem('refreshToken', validRefresh)
    storage.setItem('user', JSON.stringify({ role: 'ADMIN' }))
    const user = await restoreAuthSession(storage, async () => { throw error }, () => now)
    assert.equal(user, null)
    assert.equal(storage.getItem('accessToken'), null)
    assert.equal(storage.getItem('user'), null)
    assert.equal(storage.getItem('refreshToken'), error.response ? null : validRefresh)
  }
})

test('refresh returning incomplete access claims leaves the user signed out', async () => {
  storage.setItem('refreshToken', validRefresh)
  assert.equal(await restoreAuthSession(storage, async () => token({ ...claims, role: undefined }), () => now), null)
  assert.equal(storage.getItem('refreshToken'), null)
})

test('an old refresh failure cannot erase a newly signed-in session', async () => {
  storage.setItem('refreshToken', validRefresh)
  const nextClaims = { ...claims, user_id: 8, role: 'STAFF', email: 'next-demo@example.com' }
  const nextAccess = token(nextClaims)
  const nextRefresh = token({ ...nextClaims, token_type: 'refresh' })
  const user = await restoreAuthSession(storage, async () => {
    storage.setItem('accessToken', nextAccess)
    storage.setItem('refreshToken', nextRefresh)
    throw Object.assign(new Error('Session changed'), { code: 'INVALID_SESSION' })
  }, () => now)
  assert.equal(user.userId, 8)
  assert.equal(user.role, 'STAFF')
  assert.equal(storage.getItem('accessToken'), nextAccess)
  assert.equal(storage.getItem('refreshToken'), nextRefresh)
})

test('client shares concurrent refresh requests, keeps rotated refresh, and bounds timeout', async () => {
  storage.setItem('refreshToken', validRefresh)
  const rotatedRefresh = token({ ...claims, token_type: 'refresh', jti: 'next-demo-token' })
  let requests = 0
  axios.defaults.adapter = async (config) => {
    requests += 1
    assert.equal(config.timeout, 20000)
    assert.equal(config.url.endsWith('/api/auth/refresh/'), true)
    return { status: 200, data: { access: validAccess, refresh: rotatedRefresh }, config, headers: {} }
  }
  assert.deepEqual(await Promise.all([refreshAccessToken(), refreshAccessToken()]), [validAccess, validAccess])
  assert.equal(requests, 1)
  assert.equal(storage.getItem('refreshToken'), rotatedRefresh)
})

test('logout while refresh is pending cannot restore removed tokens', async () => {
  storage.setItem('refreshToken', validRefresh)
  let finish
  axios.defaults.adapter = (config) => new Promise((resolve) => {
    finish = () => resolve({ status: 200, data: { access: validAccess }, config, headers: {} })
  })
  const refreshing = refreshAccessToken()
  clearTokens()
  finish()
  await assert.rejects(refreshing, { code: 'INVALID_SESSION' })
  assert.equal(storage.getItem('accessToken'), null)
})

test('missing login access data cannot reuse an old stored session', () => {
  storage.setItem('accessToken', validAccess)
  assert.throws(() => setTokens({ refresh: validRefresh }), /session could not be read/)
  assert.throws(() => setTokens({ access: token({ ...claims, role: undefined }) }), /session could not be read/)
})

test('auth endpoint 401 errors are returned without refreshing or redirecting', async () => {
  storage.setItem('refreshToken', validRefresh)
  storage.setItem('accessToken', validAccess)
  api.defaults.adapter = async (config) => {
    assert.equal(config.headers.Authorization, undefined)
    throw new axios.AxiosError('Invalid demo credentials', 'ERR_BAD_REQUEST', config, null, {
      status: 401, data: { detail: 'Invalid demo credentials' }, config, headers: {},
    })
  }
  await assert.rejects(api.post('/api/auth/login/', { email: 'demo@example.com', password: 'sample-test-only' }), { code: 'ERR_BAD_REQUEST' })
  assert.equal(globalThis.window.location.href, '')
  assert.equal(storage.getItem('refreshToken'), validRefresh)
})

test('protected request 401 refreshes once and retries with the new access token', async () => {
  storage.setItem('accessToken', expiredAccess)
  storage.setItem('refreshToken', validRefresh)
  let requests = 0
  let refreshes = 0
  axios.defaults.adapter = async (config) => {
    refreshes += 1
    return { status: 200, data: { access: validAccess }, config, headers: {} }
  }
  api.defaults.adapter = async (config) => {
    requests += 1
    if (requests === 1) {
      throw new axios.AxiosError('Expired demo access', 'ERR_BAD_REQUEST', config, null, {
        status: 401, data: {}, config, headers: {},
      })
    }
    assert.equal(config.headers.Authorization, `Bearer ${validAccess}`)
    return { status: 200, data: { demo: true }, config, headers: {} }
  }
  assert.equal((await api.get('/api/patients/me/')).data.demo, true)
  assert.equal(requests, 2)
  assert.equal(refreshes, 1)
})

test('an old protected request cannot clear a new sign-in or replay its POST under another account', { timeout: 1000 }, async () => {
  storage.setItem('accessToken', expiredAccess)
  storage.setItem('refreshToken', validRefresh)
  const nextClaims = { ...claims, user_id: 8, email: 'next-demo@example.com', role: 'STAFF' }
  const nextAccess = token(nextClaims)
  const nextRefresh = token({ ...nextClaims, token_type: 'refresh' })
  let requests = 0
  let finishRefresh
  let markStarted
  const refreshStarted = new Promise((resolve) => { markStarted = resolve })
  axios.defaults.adapter = (config) => new Promise((resolve) => {
    finishRefresh = () => resolve({ status: 200, data: { access: validAccess }, config, headers: {} })
    markStarted()
  })
  api.defaults.adapter = async (config) => {
    requests += 1
    assert.equal(config.headers.Authorization, `Bearer ${expiredAccess}`)
    throw new axios.AxiosError('Expired old access', 'ERR_BAD_REQUEST', config, null, {
      status: 401, data: {}, config, headers: {},
    })
  }
  const oldRequest = api.post('/api/appointments/', { reason: 'Sample old request' })
  await refreshStarted
  setTokens({ access: nextAccess, refresh: nextRefresh })
  const nextUser = { userId: 8, email: nextClaims.email, role: 'STAFF' }
  storage.setItem('user', JSON.stringify(nextUser))
  finishRefresh()
  await assert.rejects(oldRequest, { code: 'INVALID_SESSION' })
  assert.equal(requests, 1)
  assert.equal(storage.getItem('accessToken'), nextAccess)
  assert.equal(storage.getItem('refreshToken'), nextRefresh)
  assert.deepEqual(JSON.parse(storage.getItem('user')), nextUser)
  assert.equal(globalThis.window.location.href, '')
})
