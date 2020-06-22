import {
  addAndGetSnapshot,
  setAndGetSnapshot,
  setupEmulatorAdmin
} from './helpers'

const sha1 = require('sha1')
const nock = require('nock')
const fs = require('fs')
const path = require('path')

const Github = require('../lib/github')
const prOpenedPayload = require('./fixtures/pull_request.opened')

const contributionKey = 'github.com/bocon13/cla-test/pull/3'
const contributionId = sha1(contributionKey)
const identity = 'github:bocon13'

const githubApi = 'https://api.github.com'
const statusUri = '/repos/bocon13/cla-test/statuses/2129e453f6d652badfb353c510a3669873a15f7c'
const createCommentUri = '/repos/bocon13/cla-test/issues/3/comments'
const existingCommentUri = '/repos/bocon13/cla-test/issues/comments/1'

const appId = 123

nock.disableNetConnect()

describe('Github lib', () => {
  let db
  let app
  let github
  let contribsRef
  let eventsRef
  let whitelistsRef
  let mockCert
  let mockContribution
  let mockEvent
  let payload

  beforeAll(async (done) => {
    fs.readFile(path.join(__dirname, 'fixtures/mock-cert.pem'), (err, cert) => {
      if (err) return done(err)
      mockCert = cert.toString()
      return done()
    })
  })

  beforeEach(async () => {
    const firebase = await setupEmulatorAdmin(null)
    app = firebase.app
    db = firebase.db
    contribsRef = db.collection('contributions')
    eventsRef = db.collection('events')
    whitelistsRef = db.collection('whitelists')
    github = new Github(appId, mockCert, 'secret', db)
    // Return a token for fake application (id=555)
    nock(githubApi).post('/app/installations/555/access_tokens')
      .reply(201, { token: 'test' })
    // Make a copy so we can modify it in each test
    payload = JSON.parse(JSON.stringify(prOpenedPayload))
    mockContribution = {
      key: contributionKey,
      provider: 'github',
      project: 'bocon13/cla-test',
      type: 'pull_request'
    }
    mockEvent = {
      contributionId: contributionId,
      contributionKey: contributionKey,
      provider: 'github',
      type: 'pull_request.opened',
      payload: payload
    }
  })

  afterEach(() => {
    return app.delete()
  })

  test('PR open event should be stored in the db', async () => {
    await github.receive({ name: 'pull_request', payload: payload })
    const contribution = (await contribsRef.get()).docs[0].data()
    const event = (await eventsRef.get()).docs[0].data()
    expect(contribution).toMatchObject(mockContribution)
    expect(event).toMatchObject(mockEvent)
  })

  test('Handle PR synchronize events', async () => {
    payload.action = 'synchronize'
    mockEvent.payload = payload
    mockEvent.type = 'pull_request.synchronize'
    await github.receive({ name: 'pull_request', payload: payload })
    const event = (await eventsRef.get()).docs[0].data()
    // Contribution should not be stored.
    expect((await contribsRef.doc(contributionId).get()).exists).toBe(false)
    // Just the event.
    expect(event).toMatchObject(mockEvent)
  })

  test('Handle PR close events', async () => {
    payload.action = 'closed'
    mockEvent.payload = payload
    mockEvent.type = 'pull_request.closed'
    await setAndGetSnapshot(contribsRef, mockContribution, contributionId)
    await github.receive({ name: 'pull_request', payload: payload })
    expect((await contribsRef.get()).docs.length).toBe(0)
    expect((await eventsRef.get()).docs.length).toBe(0)
  })

  test('PR should fail validation if identity is not whitelisted', async () => {
    nock(githubApi).post(statusUri, (body) => {
      expect(body.state).toEqual('failure')
      return true
    }).reply(201)
    nock(githubApi).post(createCommentUri, (req) => {
      // console.log(`CREATE COMMENT => ${req.body}`)
      expect(req.body.length).toBeGreaterThan(0)
      return true
    }).reply(201, { id: 1 })
    const contribSnapshot = await setAndGetSnapshot(contribsRef, mockContribution, contributionId)
    const eventSnapshot = await addAndGetSnapshot(eventsRef, mockEvent)
    await github.processEvent(eventSnapshot)
    const updatedContrib = (await contribSnapshot.ref.get()).data()
    const updatedEvent = (await eventSnapshot.ref.get()).data()
    expect(updatedEvent.status.state).toBe('failure')
    expect(updatedEvent.status.description.length).toBeLessThanOrEqual(140)
    expect(updatedEvent.status.githubAck).toBe(true)
    expect(updatedEvent.status.githubError).toBeFalsy()
    expect(updatedContrib.githubCommentId).toBe(1)
    expect.assertions(7)
  })

  test('PR should be validated if identity is whitelisted', async () => {
    await whitelistsRef.add({
      values: [identity]
    })
    nock(githubApi).post(statusUri, (body) => {
      expect(body.state).toEqual('success')
      return true
    }).reply(201)
    const contribSnapshot = await setAndGetSnapshot(contribsRef, mockContribution, contributionId)
    const eventSnapshot = await addAndGetSnapshot(eventsRef, mockEvent)
    await github.processEvent(eventSnapshot)
    const updatedContrib = (await contribSnapshot.ref.get()).data()
    const updatedEvent = (await eventSnapshot.ref.get()).data()
    expect(updatedEvent.status.state).toBe('success')
    expect(updatedEvent.status.description.length).toBeLessThanOrEqual(140)
    expect(updatedEvent.status.githubAck).toBe(true)
    expect(updatedEvent.status.githubError).toBeFalsy()
    expect(updatedContrib.githubCommentId).toBeFalsy()
    expect.assertions(6)
  })

  test('PR should be updated with error when posting status fails', async () => {
    nock(githubApi).post(statusUri, (body) => {
      return true
    }).reply(500)
    nock(githubApi).post(createCommentUri, (req) => {
      // console.log(`CREATE COMMENT => ${req.body}`)
      expect(req.body.length).toBeGreaterThan(0)
      return true
    }).reply(201, { id: 1 })
    await setAndGetSnapshot(contribsRef, mockContribution, contributionId)
    const eventSnapshot = await addAndGetSnapshot(eventsRef, mockEvent)
    await github.processEvent(eventSnapshot)
    const updatedEvent = (await eventSnapshot.ref.get()).data()
    expect(updatedEvent.status.githubAck).toBe(false)
    expect(updatedEvent.status.githubError.status).toBe(500)
    expect.assertions(3)
  })

  test('existing comments get removed after a PR is validated', async () => {
    await whitelistsRef.add({
      values: [identity]
    })
    nock(githubApi).post(statusUri, (body) => {
      expect(body.state).toEqual('success')
      return true
    }).reply(201)
    nock(githubApi).delete(existingCommentUri, () => {
      expect(true).toBe(true)
      return true
    }).reply(204)
    // Set existing comment ID
    mockContribution.githubCommentId = 1
    const contribSnapshot = await setAndGetSnapshot(contribsRef, mockContribution, contributionId)
    const eventSnapshot = await addAndGetSnapshot(eventsRef, mockEvent)
    await github.processEvent(eventSnapshot)
    const updatedContrib = (await contribSnapshot.ref.get()).data()
    const updatedEvent = (await eventSnapshot.ref.get()).data()
    expect(updatedEvent.status.state).toBe('success')
    expect(updatedEvent.status.description.length).toBeLessThanOrEqual(140)
    expect(updatedEvent.status.githubAck).toBe(true)
    expect(updatedEvent.status.githubError).toBeFalsy()
    expect(updatedEvent.status.comment).toBeFalsy()
    expect(updatedContrib.githubCommentId).toBeFalsy()
    expect.assertions(8)
  })

  test('existing PR comments get updated', async () => {
    nock(githubApi).post(statusUri, (body) => {
      expect(body.state).toEqual('failure')
      return true
    }).reply(201)
    nock(githubApi).patch(existingCommentUri, (req) => {
      // console.log(`UPDATE COMMENT => ${req.body}`)
      expect(req.body.length).toBeGreaterThan(0)
      return true
    }).reply(200, { id: 1 })
    // Set existing comment ID
    mockContribution.githubCommentId = 1
    const contribSnapshot = await setAndGetSnapshot(contribsRef, mockContribution, contributionId)
    const eventSnapshot = await addAndGetSnapshot(eventsRef, mockEvent)
    await github.processEvent(eventSnapshot)
    const updatedContrib = (await contribSnapshot.ref.get()).data()
    const updatedEvent = (await eventSnapshot.ref.get()).data()
    expect(updatedEvent.status.state).toBe('failure')
    expect(updatedEvent.status.description.length).toBeLessThanOrEqual(140)
    expect(updatedEvent.status.githubAck).toBe(true)
    expect(updatedEvent.status.githubError).toBeFalsy()
    expect(updatedContrib.githubCommentId).toBe(1)
    expect.assertions(7)
  })
})
