import { addAndGetSnapshot, setupEmulatorAdmin } from './helpers'
import { assertFails, assertSucceeds } from '@firebase/testing'

const Cla = require('../lib/cla')

const idJohnEmail = { type: 'email', name: 'John', value: 'john@onf.dev' }
const idEmmaEmail = { type: 'email', name: 'Emma', value: 'EMMA@onf.DEV' }
const sameAsIdEmmaEmail = { type: 'email', name: 'Emma', value: 'emma@onf.dev' }
const idEmmaGithub = { type: 'github', name: 'Emma', value: 'emma' }
const idGigiEmail = { type: 'email', name: 'Gigi', value: 'gigi@onf.dev' }
const idGigiGithub = { type: 'github', name: 'Gigi', value: 'gigi' }

const agreementId = 'the-agreement'

// TODO: use model classes for agreement and addendum
const agreement = {
  type: 'individual',
  body: 'The CLA body',
  dateSigned: new Date(),
  signer: idJohnEmail
}

const addendum1 = {
  signer: idJohnEmail,
  added: [idJohnEmail, idEmmaEmail, idEmmaGithub],
  removed: [],
  agreementId: agreementId,
  dateSigned: new Date()
}

const addendum2 = {
  signer: idJohnEmail,
  added: [idGigiEmail, idGigiGithub],
  removed: [idEmmaEmail, idEmmaGithub],
  agreementId: agreementId,
  dateSigned: new Date()
}

const addendum3 = {
  signer: idJohnEmail,
  added: [],
  removed: [idGigiGithub, idEmmaGithub],
  agreementId: agreementId,
  dateSigned: new Date()
}

describe('Cla lib', () => {
  let app
  let db
  let cla
  let agreementRef
  let whitelistRef
  let addendumsRef
  let addendumSnapshot
  let whitelistDoc

  beforeEach(async () => {
    // Set up independent app/db for each test so we avoid conflicts when
    // executing tests in parallel
    const firebase = await setupEmulatorAdmin(null)
    app = firebase.app
    db = firebase.db
    cla = new Cla(db)
    agreementRef = db.collection('agreements').doc(agreementId)
    whitelistRef = db.collection('whitelists').doc(agreementId)
    addendumsRef = db.collection('addendums')
  })

  afterEach(async () => {
    await app.delete()
  })

  it('should update whitelist', async () => {
    // Add agreement
    expect(await assertSucceeds(agreementRef.set(agreement)))
    // Add addendum 1
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum1)
    // Update whitelist
    expect(await assertSucceeds(cla.updateWhitelist(addendumSnapshot)))
    // Verify whitelist
    expect(await cla.isIdentityWhitelisted(idJohnEmail)).toBe(true)
    expect(await cla.isIdentityWhitelisted(sameAsIdEmmaEmail)).toBe(true)
    expect(await cla.isIdentityWhitelisted(idEmmaEmail)).toBe(true)
    expect(await cla.isIdentityWhitelisted(idEmmaGithub)).toBe(true)

    // Add addendum
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum2)
    // Update whitelist
    expect(await assertSucceeds(cla.updateWhitelist(addendumSnapshot)))
    // Verify whitelist
    expect(await cla.isIdentityWhitelisted(sameAsIdEmmaEmail)).toBe(false)
    expect(await cla.isIdentityWhitelisted(idEmmaEmail)).toBe(false)
    expect(await cla.isIdentityWhitelisted(idEmmaGithub)).toBe(false)
    expect(await cla.isIdentityWhitelisted(idGigiEmail)).toBe(true)
    expect(await cla.isIdentityWhitelisted(idGigiGithub)).toBe(true)

    expect(await cla.checkIdentities([
      idJohnEmail, idGigiGithub, idGigiEmail])).toEqual({
      allWhitelisted: true,
      missingIdentities: []
    })

    expect(await cla.checkIdentities([
      idJohnEmail, idEmmaGithub])).toEqual({
      allWhitelisted: false,
      // FIXME: missingIdentities should contain the same identity object used
      //  as input
      missingIdentities: ['github:emma']
    })

    // Add addendum
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum3)
    // Update whitelist
    expect(await assertSucceeds(cla.updateWhitelist(addendumSnapshot)))
    // Verify whitelist
    whitelistDoc = (await whitelistRef.get()).data()
    // We removed all github IDs
    expect(!Array.isArray(whitelistDoc.github) || !whitelistDoc.github.length).toBe(true)
  })

  it('should NOT be possible to update the whitelist for a non-existing agreement', async () => {
    // Add mock addendum referencing a non-existing agreement
    const mockAddendum = { ...addendum1 }
    mockAddendum.agreementId = 'i-dont-exist'
    const mockSnapshot = await addAndGetSnapshot(addendumsRef, mockAddendum)
    // Update whitelist
    expect(await assertFails(cla.updateWhitelist(mockSnapshot)))
    expect(await assertFails(cla.updateWhitelist(null, 'i-dont-exist')))
  })

  it('should fail checking an invalid identity', async () => {
    expect(await cla.isIdentityWhitelisted(null)).toBe(false)
    expect(await cla.isIdentityWhitelisted({ foo: 'bar' })).toBe(false)
    expect(await cla.isIdentityWhitelisted({
      type: 'foo',
      value: 'bar'
    })).toBe(false)

    expect(await cla.checkIdentities(null)).toEqual({
      allWhitelisted: false,
      missingIdentities: []
    })

    expect(await cla.checkIdentities([])).toEqual({
      allWhitelisted: false,
      missingIdentities: []
    })
  })

  it('should be possible to check multiple identities at once', async () => {
    const identities = [idEmmaEmail, idEmmaGithub, sameAsIdEmmaEmail, idGigiGithub]
    expect(await cla.checkIdentities(identities))
  })

  it('should throw error if no valid argument is passed to updateWhitelist', async () => {
    expect(await assertFails(cla.updateWhitelist(null, null)))
  })

  it('should update whitelist if passing only an agreementId', async () => {
    // Add agreement
    expect(await assertSucceeds(agreementRef.set(agreement)))
    // Add addendum
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum1)
    // Update whitelist by passing agreementId instead of snapshot
    expect(await assertSucceeds(cla.updateWhitelist(null, agreementId)))
    // Verify whitelist
    expect(await cla.isIdentityWhitelisted(idJohnEmail)).toBe(true)
    expect(await cla.isIdentityWhitelisted(idEmmaEmail)).toBe(true)
    expect(await cla.isIdentityWhitelisted(idEmmaGithub)).toBe(true)
    expect(await cla.isIdentityWhitelisted(sameAsIdEmmaEmail)).toBe(true)
  })
})
