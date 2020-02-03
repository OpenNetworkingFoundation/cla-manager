import { addAndGetSnapshot, setupDbAdmin, teardownDb } from './helpers'
import { assertFails, assertSucceeds } from '@firebase/testing'
import { Identity, IdentityType } from '../lib/common/model/identity'

const Cla = require('../lib/cla')
const idJohnEmail = new Identity(IdentityType.EMAIL, 'John', 'john@onf.dev').toJson()
const idEmmaEmail = new Identity(IdentityType.EMAIL, 'Emma', 'emma@onf.dev').toJson()
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

    // Add addendum 1 (which adds identity2 and identity3)
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum1)
    // Update whitelist
    expect(await assertSucceeds(cla.updateWhitelist(addendumSnapshot)))
    // Verify agreement
    whitelistDoc = (await whitelistRef.get()).data()
    expect(whitelistDoc.email).toContain(idJohnEmail.value)
    expect(whitelistDoc.email).toContain(idEmmaEmail.value)
    expect(whitelistDoc.github).toContain(idEmmaGithub.value)

    // Add addendum
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum2)
    // Update whitelist
    expect(await assertSucceeds(cla.updateWhitelist(addendumSnapshot)))
    // Verify agreement
    whitelistDoc = (await whitelistRef.get()).data()
    expect(whitelistDoc.email).not.toContain(idEmmaEmail.value)
    expect(whitelistDoc.github).not.toContain(idEmmaGithub.value)
    expect(whitelistDoc.email).toContain(idGigiEmail.value)
    expect(whitelistDoc.github).toContain(idGigiGithub.value)

    // Add addendum
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum3)
    // Update whitelist
    expect(await assertSucceeds(cla.updateWhitelist(addendumSnapshot)))
    // Verify agreement
    whitelistDoc = (await whitelistRef.get()).data()
    // We removed all github IDs
    expect(!Array.isArray(whitelistDoc.github) || !whitelistDoc.github.length).toBeTruthy()
  })

  it('should NOT be possible to update the whitelist for a non-existing agreement', async () => {
    // Add addendum 1 (which adds identity2 and identity3)
    const mockAddendum = { ...addendum1 }
    mockAddendum.agreementId = 'foo'
    const mockSnapshot = await addAndGetSnapshot(addendumsRef, mockAddendum)
    // Update whitelist
    expect(await assertFails(cla.updateWhitelist(mockSnapshot)))
  })
})
