import { addAndGetSnapshot, setupDbAdmin, teardownDb } from './helpers'
import { assertFails, assertSucceeds } from '@firebase/testing'
import { Identity, IdentityType } from '../lib/common/model/identity'

const Cla = require('../lib/cla')
const idJohnEmail = new Identity(IdentityType.EMAIL, 'John', 'john@onf.dev').toJson()
const idEmmaEmail = new Identity(IdentityType.EMAIL, 'Emma', 'EMMA@onf.DEV').toJson()
const sameAsIdEmmaEmail = new Identity(IdentityType.EMAIL, 'Emma', 'emma@onf.dev').toJson()
const idEmmaGithub = new Identity(IdentityType.GITHUB, 'Emma', 'emma').toJson()
const idGigiEmail = new Identity(IdentityType.EMAIL, 'Gigi', 'gigi@onf.dev').toJson()
const idGigiGithub = new Identity(IdentityType.GITHUB, 'Gigi', 'gigi').toJson()

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
  let db
  let cla
  let agreementRef
  let whitelistRef
  let addendumsRef
  let addendumSnapshot
  let whitelistDoc

  // Applies only to tests in this describe block
  beforeAll(async () => {
    db = await setupDbAdmin(null)
    cla = new Cla(db)
    agreementRef = db.collection('agreements').doc(agreementId)
    whitelistRef = db.collection('whitelists').doc(agreementId)
    addendumsRef = db.collection('addendums')
  })

  afterAll(async () => {
    await teardownDb()
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
})
