import { addAndGetSnapshot, setupDbAdmin, teardownDb } from './helpers'

const nock = require('nock')
const fs = require('fs')
const path = require('path')

const Octokit = require('@octokit/rest')

// Requiring our app implementation
const Github = require('../lib/github')

// Requiring our fixtures
const payload = require('./fixtures/pull_request.opened')
const hugePayload = require('./fixtures/pull_request.opened.huge')
const commits = require('./fixtures/commits')

const mockRequest = {
  app: { installationId: 555 },
  contributionId: 'github.com/bocon13/cla-test/pull/3',
  event: 'pull_request.opened',
  payload: payload,
  type: 'github',
  identities: null,
  lastRunStatus: null,
  lastRunOn: null,
  processedCount: 0
}

const mockIdentities = ['github:bocon13', 'email:bocon@opennetworking.org']

const statusUri = '/repos/bocon13/cla-test/statuses/2129e453f6d652badfb353c510a3669873a15f7c'

const appId = 123

const projectId = 'github-test-' + new Date()

nock.disableNetConnect()

describe('Github lib', () => {
  let db
  let github
  let mockCert
  let requestsRef

  beforeAll(async (done) => {
    db = await setupDbAdmin(null, projectId)
    requestsRef = db.collection('requests')
    fs.readFile(path.join(__dirname, 'fixtures/mock-cert.pem'), (err, cert) => {
      if (err) return done(err)
      mockCert = cert.toString()
      return done()
    })
  })

  afterEach(async () => {
    // FIXME: find a way to clear the database after each test.
    //  calling this triggers a grpc error
    // await clearDb(projectId)
  })

  afterAll(async () => {
    await teardownDb()
  })

  beforeEach(() => {
    github = new Github(appId, mockCert, 'secret', db)
    // Return a token for fake application (id=555)
    nock('https://api.github.com')
      .post('/app/installations/555/access_tokens')
      .reply(200, { token: 'test' })
    // Return the list of commits for PR #3
    nock('https://api.github.com')
      .get('/repos/bocon13/cla-test/pulls/3/commits')
      .reply(200, commits)
  })

  test('PR identities should be extracted', async () => {
    const octokit = new Octokit({ auth: 'accesstoken' })
    const identities = await github.getPrIdentities(payload.pull_request, octokit)
    expect(identities.length).toBe(2)
    expect(identities[0]).toBe(mockIdentities[0])
    expect(identities[1]).toBe(mockIdentities[1])
    expect(true)
  })

  test('Commit identities should be extracted', async () => {
    const identities = github.getCommitIdentities(commits[0])
    expect(identities.length).toBe(2)
    expect(identities[0]).toBe(mockIdentities[0])
    expect(identities[1]).toBe(mockIdentities[1])
  })

  test('PR request should be stored in the db after a pull request event', async () => {
    await github.receive({ name: 'pull_request', payload })
    const request = (await requestsRef.get()).docs[0].data()
    expect(request).toMatchObject(request)
  })

  test('PR request should fail validation', async () => {
    nock('https://api.github.com')
      .post(statusUri,
        (body) => {
          expect(body.state).toEqual('failure')
          return true
        })
      .reply(200)
    const snapshot = await addAndGetSnapshot(requestsRef, mockRequest)
    await github.processRequest(snapshot)
    const updatedRequest = (await snapshot.ref.get()).data()
    expect(updatedRequest.lastStatus.state).toBe('failure')
    expect(updatedRequest.lastStatus.description.length).toBeLessThanOrEqual(140)
    expect(updatedRequest.lastStatus.octoAck).toBe(true)
    expect(updatedRequest.processedCount).toBe(1)
    expect.assertions(5)
  })

  test('PR request should fail CLA validation if only some identities are not whitelisted', async () => {
    // Only one of the requested entities is in the db.
    await db.collection('whitelists').add({
      values: mockIdentities[0]
    })
    nock('https://api.github.com')
      .post(statusUri,
        (body) => {
          expect(body.state).toEqual('failure')
          return true
        })
      .reply(200)
    const snapshot = await addAndGetSnapshot(requestsRef, mockRequest)
    await github.processRequest(snapshot)
    const updatedRequest = (await snapshot.ref.get()).data()
    expect(updatedRequest.lastStatus.state).toBe('failure')
    expect(updatedRequest.lastStatus.description.length).toBeLessThanOrEqual(140)
    expect(updatedRequest.lastStatus.octoAck).toBe(true)
    expect.assertions(4)
  })

  test('PR request should be successfully validated', async () => {
    // All requested identities are in the whitelist.
    await db.collection('whitelists').add({
      values: mockIdentities
    })
    nock('https://api.github.com')
      .post(statusUri,
        (body) => {
          expect(body.state).toEqual('success')
          return true
        })
      .reply(200)
    const snapshot = await addAndGetSnapshot(requestsRef, mockRequest)
    await github.processRequest(snapshot)
    const updatedRequest = (await snapshot.ref.get()).data()
    expect(updatedRequest.lastStatus.state).toBe('success')
    expect(updatedRequest.lastStatus.description.length).toBeLessThanOrEqual(140)
    expect(updatedRequest.lastStatus.octoAck).toBe(true)
    expect.assertions(4)
  })

  test('PR request should be updated when posting github status fails', async () => {
    nock('https://api.github.com')
      .post(statusUri,
        (body) => {
          return true
        })
      .reply(404)
    const snapshot = await addAndGetSnapshot(requestsRef, mockRequest)
    await github.processRequest(snapshot)
    const updatedRequest = (await snapshot.ref.get()).data()
    expect(updatedRequest.lastStatus.octoAck).toBe(false)
    expect(updatedRequest.lastStatus.octoError.status).toBe(404)
  })

  test('PR request should error if it exceeds the commit limit', async () => {
    nock('https://api.github.com')
      .post(statusUri,
        (body) => {
          expect(body.state).toEqual('error')
          // The user should see mention of the limit.
          expect(body.description).toContain('250')
          return true
        })
      .reply(200)
    const hugeRequest = JSON.parse(JSON.stringify(mockRequest))
    hugeRequest.payload = hugePayload
    const snapshot = await addAndGetSnapshot(requestsRef, hugeRequest)
    await github.processRequest(snapshot)
    const updatedRequest = (await snapshot.ref.get()).data()
    expect(updatedRequest.lastStatus.state).toBe('error')
    expect(updatedRequest.lastStatus.description.length).toBeLessThanOrEqual(140)
    expect(updatedRequest.lastStatus.octoAck).toBe(true)
    expect.assertions(5)
  })

  test('PR request should fail if identities are empty', async () => {
    nock('https://api.github.com')
      .post(statusUri,
        (body) => {
          expect(body.state).toEqual('error')
          // The user should see mention of the issue.
          expect(body.description).toContain('empty')
          return true
        })
      .reply(200)
    const req = JSON.parse(JSON.stringify(mockRequest))
    req.identities = []
    const snapshot = await addAndGetSnapshot(requestsRef, req)
    await github.processRequest(snapshot)
    const updatedRequest = (await snapshot.ref.get()).data()
    expect(updatedRequest.lastStatus.state).toBe('error')
    expect(updatedRequest.lastStatus.description.length).toBeLessThanOrEqual(140)
    expect(updatedRequest.lastStatus.octoAck).toBe(true)
    expect.assertions(5)
  })
})
