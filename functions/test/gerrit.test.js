import { setupEmulatorAdmin } from './helpers'

const rp = require('request-promise')
const Gerrit = require('../lib/gerrit')

const port = 57586
const url = 'http://localhost:' + port

describe('Gerrit lib', () => {
  let db
  let app
  let gerritApp
  let server

  beforeAll(async (done) => {
    const firebase = await setupEmulatorAdmin(null)
    app = firebase.app
    db = firebase.db
    gerritApp = Gerrit(db).app
    server = gerritApp.listen(port, () => {
      // console.log('App listening on port ' + port)
      done()
    })
  })

  afterAll(async () => {
    server.close().then(app.delete)
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
    app.delete()
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
