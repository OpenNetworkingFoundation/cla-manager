const nock = require('nock')
const fs = require('fs')
const path = require('path')

// Requiring our app implementation
const Github = require('../github')

// Requiring our fixtures
const payload = require('./fixtures/pull_request.opened')
const hugePayload = require('./fixtures/pull_request.opened.huge')
const commits = require('./fixtures/commits')

const statusSucceededBody = {
  state: 'success',
  description: 'CLA is signed',
  context: 'cla-manager'
}

const statusFailedBody = {
  state: 'failure',
  target_url: 'https://sign.the.cla',
  description: 'CLA is not signed',
  context: 'cla-manager'
}

nock.disableNetConnect()

describe('Github PR Webhook', () => {
  let github
  let mockCert
  const cla = {
    isClaSigned: () => false
  }

  beforeAll((done) => {
    fs.readFile(path.join(__dirname, 'fixtures/mock-cert.pem'), (err, cert) => {
      if (err) return done(err)
      mockCert = cert
      return done()
    })
  })

  beforeEach(() => {
    github = new Github({
      id: 123, // App ID
      cert: mockCert, // App Private Key
      secret: 'secret', // Webhook Secret
      cla: cla
    })
    // Return a token for fake application (id=555)
    nock('https://api.github.com')
      .post('/app/installations/555/access_tokens')
      .reply(200, { token: 'test' })
    // Return the list of commits for PR #3
    nock('https://api.github.com')
      .get('/repos/bocon13/cla-test/pulls/3/commits')
      .reply(200, commits)
  })

  test('CLA not signed for PR with one commit', async () => {
    nock('https://api.github.com')
      .post('/repos/bocon13/cla-test/statuses/2129e453f6d652badfb353c510a3669873a15f7c',
        (body) => {
          expect(body).toMatchObject(statusFailedBody)
          return true
        })
      .reply(200)

    expect.assertions(1)
    // Receive a webhook event
    await github.receive({ name: 'pull_request', payload })
  })

  test('CLA signed for PR with one commit', async () => {
    cla.isClaSigned = () => true

    nock('https://api.github.com')
      .post('/repos/bocon13/cla-test/statuses/2129e453f6d652badfb353c510a3669873a15f7c',
        (body) => {
          expect(body).toMatchObject(statusSucceededBody)
          return true
        })
      .reply(200)

    expect.assertions(1)
    // Receive a webhook event
    await github.receive({ name: 'pull_request', payload })
  })

  test('Fail on 300 commits', async () => {
    // Receive a webhook event
    await github.receive({ name: 'pull_request', payload: hugePayload })
      .then(() => {

      }, error => {
        expect(error.errors[0].message).toBe('number of commits exceeds the 250 commit limit')
      })
  })
})
