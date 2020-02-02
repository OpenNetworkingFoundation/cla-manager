import { addAndGetSnapshot, setupDbAdmin, teardownDb } from './helpers'
import { assertFails, assertSucceeds } from '@firebase/testing'

const Contributor = require('../lib/contributor')

const user1 = { name: 'John', email: 'john@onf.dev', githubId: 'john' }
const user2 = { name: 'Emma', email: 'emma@onf.dev', githubId: 'emma' }
const user3 = { name: 'Gigi', email: 'gigi@onf.dev', githubId: 'gigi' }

const agreementId = 'the-agreement'

const agreement = {
  type: 'individual',
  body: 'The CLA body',
  dateSigned: new Date(),
  signer: user1
}

const addendum1 = {
  signer: user1,
  added: [user2, user3],
  removed: [],
  agreementId: agreementId,
  dateSigned: new Date()
}

const addendum2 = {
  signer: user1,
  added: [],
  removed: [user3],
  agreementId: agreementId,
  dateSigned: new Date()
}

describe('Contributor function', () => {
  let db
  let contributor
  let agreementRef
  let addendumsRef
  let addendumSnapshot
  let agreementDoc

  // Applies only to tests in this describe block
  beforeAll(async () => {
    db = await setupDbAdmin(null)
    contributor = new Contributor(db)
    agreementRef = db.collection('agreements').doc(agreementId)
    addendumsRef = db.collection('addendums')
  })

  afterAll(async () => {
    await teardownDb()
  })

  it('should update active contributors in parent agreement', async () => {
    // Add agreement
    expect(await assertSucceeds(agreementRef.set(agreement)))
    // Add addendum 1 (which adds user2 and user3)
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum1)
    // Update active contributors in parent agreement
    expect(await assertSucceeds(
      contributor.updateActiveContributors(addendumSnapshot)))
    // Verify agreement
    agreementDoc = (await agreementRef.get()).data()
    expect(agreementDoc.activeEmails).toContain(user2.email)
    expect(agreementDoc.activeEmails).toContain(user3.email)
    expect(agreementDoc.activeGithubIds).toContain(user2.githubId)
    expect(agreementDoc.activeGithubIds).toContain(user3.githubId)

    // Add addendum 2 (which removes user3)
    addendumSnapshot = await addAndGetSnapshot(addendumsRef, addendum2)
    // Update active contributors in parent agreement
    expect(await assertSucceeds(
      contributor.updateActiveContributors(addendumSnapshot)))
    // Verify agreement
    agreementDoc = (await agreementRef.get()).data()
    expect(agreementDoc.activeEmails).toContain(user2.email)
    expect(agreementDoc.activeEmails).not.toContain(user3.email)
    expect(agreementDoc.activeGithubIds).toContain(user2.githubId)
    expect(agreementDoc.activeGithubIds).not.toContain(user3.githubId)
  })

  it('should NOT be possible to update non-existing agreement', async () => {
    // Add addendum 1 (which adds user2 and user3)
    const mockAddendum = { ...addendum1 }
    mockAddendum.agreementId = 'foo'
    const mockSnapshot = await addAndGetSnapshot(addendumsRef, mockAddendum)
    // Update active contributors in parent agreement. It should fail.
    expect(await assertFails(
      contributor.updateActiveContributors(mockSnapshot)))
  })
})
