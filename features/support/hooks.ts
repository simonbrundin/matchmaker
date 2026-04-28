import { Before, After, setWorldConstructor } from '@cucumber/cucumber'
import assert from 'assert'

class CustomWorld {
  constructor({ attach }) {
    this.attach = attach
    this.lastResponse = null
    this.lastRequestBody = null
  }

  async sendGet(path) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}${path}`)
    const body = await res.json().catch(() => ({}))
    this.lastResponse = { status: res.status, body }
    return this.lastResponse
  }

  async sendPost(path, body = {}) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const responseBody = await res.json().catch(() => ({}))
    this.lastResponse = { status: res.status, body: responseBody }
    return this.lastResponse
  }
}

setWorldConstructor(CustomWorld)

Before(async function () {
  this.lastResponse = null
  this.lastRequestBody = null
})

After(async function () {
  // Cleanup after each scenario
})