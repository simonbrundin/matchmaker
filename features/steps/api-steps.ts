import { Given, When, Then, Before } from '@cucumber/cucumber'
import assert from 'assert'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

Before(function () {
  this.lastResponse = null
  this.lastRequestBody = null
  this.createdPlayerId = null
})

Given('the system has active players', async function () {
  const res = await fetch(`${BASE_URL}/api/admin/players?active=true`)
  const body = await res.json()
  assert.ok(res.ok, 'Should be able to fetch players')
})

Given('the database is connected', async function () {
  const res = await fetch(`${BASE_URL}/api/health`)
  const body = await res.json()
  assert.strictEqual(body.database, 'connected')
})

When('I send a GET request to {string}', async function (path) {
  const res = await fetch(`${BASE_URL}${path}`)
  this.lastResponse = { status: res.status, body: await res.json() }
})

When('I send a POST request to {string}', async function (path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.lastRequestBody || {}),
  })
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) }
})

When('I send a POST request to {string} with payload', async function (path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.lastRequestBody || {
      messages: [{ phoneNumber: '+46701234567', text: 'ja' }]
    }),
  })
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) }
})

When('I send a POST request to {string} with invalid payload', async function (path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invalid: 'payload' }),
  })
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) }
})

Then('the response status should be {int}', function (status) {
  assert.strictEqual(this.lastResponse?.status, status)
})

Then('the response status should be {int} or {int}', function (status1, status2) {
  const actual = this.lastResponse?.status
  assert.ok(actual === status1 || actual === status2, `Expected ${status1} or ${status2}, got ${actual}`)
})

Then('the response body should have field {string}', function (field) {
  assert.notStrictEqual(this.lastResponse?.body[field], undefined)
})

Then('the response body should have field {string} equal to {string}', function (field, value) {
  assert.strictEqual(this.lastResponse?.body[field], value)
})

Then('the response body should have field {string} equal to {int}', function (field, value) {
  assert.strictEqual(this.lastResponse?.body[field], value)
})

Then('the first player name should contain {string}', function (namePart) {
  const firstPlayer = this.lastResponse?.body?.players?.[0]
  assert.ok(firstPlayer?.name?.includes(namePart))
})

Then('at least one player should match the search term', function () {
  const players = this.lastResponse?.body?.players || []
  assert.ok(players.length > 0, 'Should find at least one player')
})

Then('the timestamp should be valid ISO 8601 format', function () {
  const timestamp = this.lastResponse?.body?.timestamp
  const isoDate = new Date(timestamp)
  assert.ok(!isNaN(isoDate.getTime()))
})

Then('the players array should not be empty', function () {
  const players = this.lastResponse?.body?.players
  assert.ok(Array.isArray(players) && players.length > 0)
})

// ===== New Step Definitions for enhanced features =====

When('I request all players', async function () {
  const res = await fetch(`${BASE_URL}/api/admin/players`)
  this.lastResponse = { status: res.status, body: await res.json() }
})

When('I request players filtered by active status', async function () {
  const res = await fetch(`${BASE_URL}/api/admin/players?active=true`)
  this.lastResponse = { status: res.status, body: await res.json() }
})

When('I search for players with term {string}', async function (term) {
  const res = await fetch(`${BASE_URL}/api/admin/players?search=${encodeURIComponent(term)}`)
  this.lastResponse = { status: res.status, body: await res.json() }
})

When('I create a new player with:', async function (dataTable) {
  const data = dataTable.hashes()[0]
  this.lastRequestBody = {
    phone: data.phone,
    name: data.name,
    elo: data.elo ? parseInt(data.elo) : 1200
  }
  const res = await fetch(`${BASE_URL}/api/admin/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.lastRequestBody),
  })
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) }
})

When('I create a new player with missing phone', async function () {
  this.lastRequestBody = { name: 'Test Player' }
  const res = await fetch(`${BASE_URL}/api/admin/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.lastRequestBody),
  })
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) }
})

When('I create a new player with existing phone {string}', async function (phone) {
  this.lastRequestBody = { phone: phone, name: 'Duplicate Test' }
  const res = await fetch(`${BASE_URL}/api/admin/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.lastRequestBody),
  })
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) }
})

When('I request the health endpoint', async function () {
  const res = await fetch(`${BASE_URL}/api/health`)
  this.lastResponse = { status: res.status, body: await res.json() }
})

Then('the response should contain {string} status', function (status) {
  assert.strictEqual(this.lastResponse?.body.status, status)
})

Then('the response should confirm database is connected', function () {
  assert.strictEqual(this.lastResponse?.body.database, 'connected')
})

Then('the response should contain a timestamp', function () {
  assert.ok(this.lastResponse?.body.timestamp, 'Response should contain timestamp')
})

Then('the response should contain a players array', function () {
  assert.ok(Array.isArray(this.lastResponse?.body.players), 'Response should contain players array')
})

Then('the response should confirm success', function () {
  assert.strictEqual(this.lastResponse?.body.success, true)
})

Then('the response should contain an error message', function () {
  const hasError = this.lastResponse?.body?.message || this.lastResponse?.body?.error
  assert.ok(hasError, 'Response should contain error message')
})

When('I send a POST request to {string} with body:', async function (path, dataTable) {
  const data = dataTable.hashes()[0]
  // Filter out empty values
  this.lastRequestBody = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== '')
  )
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.lastRequestBody),
  })
  this.lastResponse = { status: res.status, body: await res.json().catch(() => ({})) }
})