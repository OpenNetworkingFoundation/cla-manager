import { setupDbAdmin, teardownDb } from './helpers'

const rp = require('request-promise')
const Gerrit = require('../lib/gerrit')

const port = 57586
const url = 'http://localhost:' + port

describe('Gerrit lib', () => {
  let db
  let app
  let server

  beforeAll(async (done) => {
    db = await setupDbAdmin(null, 'gerrit-test')
    app = Gerrit(db).app
    server = app.listen(port, () => {
      // console.log('App listening on port ' + port)
      done()
    })
  })

  afterAll(async () => {
    return teardownDb().then(() => server.close())
  })

  it('should return error is no email param is provided', async () => {
    return rp({ uri: url, json: true }).then((response) => {
      expect(response.status).toBe('error')
      expect(response.message).toContain('missing email')
    })
  })

  it('should return failure if a non-whitelisted identity is passed', async () => {
    return rp({
      uri: url,
      qs: { email: 'foo@bar.com' },
      json: true
    }).then((response) => {
      expect(response.status).toBe('failure')
      expect(response.message).toContain('we need to ask you to sign a' +
        ' Contributor License Agreement')
    })
  })

  it('should return success if a whitelisted identity is passed', async () => {
    await db.collection('whitelists').add({
      values: ['email:foo@bar.com']
    })
    return rp({
      uri: url,
      qs: { email: 'foo@bar.com' },
      json: true
    }).then((response) => {
      expect(response.status).toBe('success')
      expect(response.message).toBeFalsy()
    })
  })

  it('should return error in case of other errors', async () => {
    // Kill db prematurely
    await teardownDb()
    return rp({
      uri: url,
      qs: { email: 'foo@bar.com' },
      json: true
    }).then((response) => {
      expect(response.status).toBe('error')
      expect(response.message).toContain('Internal error, unable to verify CLA')
    })
  })
})
