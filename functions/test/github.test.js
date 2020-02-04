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

const checkIdentifiesSuccess = async () => {
  return Promise.resolve({
    allWhitelisted: true,
    missingIdentities: []
  })
}

const checkIdentifiesFail = async () => {
  return Promise.resolve({
    allWhitelisted: false,
    missingIdentities: []
  })
}

nock.disableNetConnect()

describe('Github PR Webhook', () => {
  const appId = 123
  let github
  let mockCert
  const cla = {
    checkIdentities: checkIdentifiesSuccess
  }

  beforeAll((done) => {
    fs.readFile(path.join(__dirname, 'fixtures/mock-cert.pem'), (err, cert) => {
      if (err) return done(err)
      mockCert = cert
      return done()
    })
  })

  beforeEach(() => {
    github = new Github(appId, mockCert, 'secret', cla)
    // Return a token for fake application (id=555)
    nock('https://api.github.com')
      .post('/app/installations/555/access_tokens')
      .reply(200, { token: 'test' })
    // Return the list of commits for PR #3
    nock('https://api.github.com')
      .get('/repos/bocon13/cla-test/pulls/3/commits')
      .reply(200, commits)
  })

  test('PR identities can be extracted', async () => {
    const ghClient = new Octokit({ auth: 'accesstoken' })
    const identities = await github.getPrIdentities(payload.pull_request, ghClient)
    expect(identities[0]).toMatchObject({ type: 'github', value: 'bocon13' })
    expect(identities[1]).toMatchObject({ type: 'github', value: 'bocon13' })
    expect(identities[2]).toMatchObject({
      type: 'email',
      value: 'bocon@opennetworking.org'
    })
    expect(true)
  })

  test('Commit identities can be extracted', async () => {
    const identities = github.getCommitIdentities(commits[0])
    expect(identities[0]).toMatchObject({ type: 'github', value: 'bocon13' })
    expect(identities[1]).toMatchObject({
      type: 'email',
      value: 'bocon@opennetworking.org'
    })
  })

  test('CLA not signed for PR with one commit', async () => {
    cla.checkIdentities = checkIdentifiesFail
    nock('https://api.github.com')
      .post('/repos/bocon13/cla-test/statuses/2129e453f6d652badfb353c510a3669873a15f7c',
        (body) => {
          expect(body.state).toEqual('failure')
          return true
        })
      .reply(200)
    expect.assertions(1)
    // Receive a webhook event
    await github.receive({ name: 'pull_request', payload })
  })

  test('CLA signed for PR with one commit', async () => {
    cla.checkIdentities = checkIdentifiesSuccess
    nock('https://api.github.com')
      .post('/repos/bocon13/cla-test/statuses/2129e453f6d652badfb353c510a3669873a15f7c',
        (body) => {
          expect(body.state).toEqual('success')
          return true
        })
      .reply(200)
    expect.assertions(1)
    // Receive a webhook event
    await github.receive({ name: 'pull_request', payload })
  })

  test('Fail on 300 commits', async () => {
    nock('https://api.github.com')
      .post('/repos/bocon13/cla-test/statuses/2129e453f6d652badfb353c510a3669873a15f7c',
        (body) => {
          expect(body.state).toEqual('failure')
          expect(body.description).toContain('250')
          return true
        })
      .reply(200)
    expect.assertions(2)
    // Receive a webhook event
    await github.receive({ name: 'pull_request', payload: hugePayload })
  })
})
