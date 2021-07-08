import { setupEmulatorAdmin } from './helpers'

const rp = require('request-promise')
const Gerrit = require('../lib/gerrit')

const port = 57586
const httpUser = 'admin'
const httpPassword = 'supersecret'
const rpConf = {
  uri: 'http://localhost:' + port,
  json: true,
  auth: {
    user: httpUser,
    pass: httpPassword,
    sendImmediately: true
  }
}

describe('Gerrit lib', () => {
  let db
  let app
  let gerritApp
  let server

  beforeAll(async (done) => {
    const firebase = await setupEmulatorAdmin(null)
    app = firebase.app
    db = firebase.db
    gerritApp = Gerrit(db, httpUser, httpPassword).app
    server = gerritApp.listen(port, () => {
      // console.info('App listening on port ' + port)
      done()
    })
  })

  afterAll(async () => {
    server.close().then(app.delete)
  })

  it('should return error is no email param is provided', async () => {
    return rp(rpConf).then((response) => {
      expect(response.status).toBe('error')
      expect(response.message).toContain('missing email')
    })
  })

  it('should return failure if a non-whitelisted identity is passed', async () => {
    return rp({
      ...rpConf,
      qs: { email: 'foo@bar.com' }
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
      ...rpConf,
      qs: { email: 'foo@bar.com' }
    }).then((response) => {
      expect(response.status).toBe('success')
      expect(response.message).toBeFalsy()
    })
  })

  it('should return error in case of other errors', async () => {
    // Kill db prematurely
    app.delete()
    return rp({
      ...rpConf,
      qs: { email: 'foo@bar.com' }
    }).then((response) => {
      expect(response.status).toBe('error')
      expect(response.message).toContain('Internal error, unable to verify CLA')
    })
  })
})
