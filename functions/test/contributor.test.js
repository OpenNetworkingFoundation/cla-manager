import { setupDbAdmin, teardownDb } from './helpers'
import { assertSucceeds } from '@firebase/testing'

const Contributor = require('../lib/contributor')

const user1 = { name: 'John', email: 'john@onf.dev', githubId: 'john' }
const user2 = { name: 'Emma', email: 'emma@onf.dev', githubId: 'emma' }
const user3 = { name: 'Gigi', email: 'gigi@onf.dev', githubId: 'gigi' }

const startingData = {
  agreements: {
    a1: {
      type: 'individual',
      body: 'The CLA body',
      dateSigned: new Date(),
      signer: user1
    }
  }
}

const addendum1 = {
  signer: user1,
  added: [user2, user3],
  removed: [],
  agreementId: 'a1',
  dateSigned: new Date()
}

const addendum2 = {
  signer: user1,
  added: [],
  removed: [user3],
  agreementId: 'a1',
  dateSigned: new Date()
}

describe('Contributor function', () => {
  let db
  let contributor

  // Applies only to tests in this describe block
  beforeAll(async () => {
    db = await setupDbAdmin(startingData)
    contributor = new Contributor(db)
  })

  afterAll(async () => {
    await teardownDb()
  })

  it('should update active contributors in parent agreement', async () => {
    // Create addendum 1 (which adds user2 and user3)
    expect(await assertSucceeds(db.collection('addendums')
      .doc('a1').set(addendum1)
    ))

    // Update active contributors in parent agreement
    expect(await assertSucceeds(contributor.updateActiveContributors(
      await db.collection('addendums').doc('a1').get())))

    // Verify agreement
    let agreement = (await db.collection('agreements')
      .doc('a1').get()).data()
    expect(agreement.activeEmails).toContain(user2.email)
    expect(agreement.activeEmails).toContain(user3.email)
    expect(agreement.activeGithubIds).toContain(user2.githubId)
    expect(agreement.activeGithubIds).toContain(user3.githubId)

    // Create addendum 2 (which removes user3)
    expect(await assertSucceeds(db.collection('addendums')
      .doc('a2').set(addendum2)
    ))

    // Update active contributors in parent agreement
    expect(await assertSucceeds(contributor.updateActiveContributors(
      await db.collection('addendums').doc('a2').get())))

    // Verify agreement
    agreement = (await db.collection('agreements')
      .doc('a1').get()).data()
    expect(agreement.activeEmails).toContain(user2.email)
    expect(agreement.activeEmails).not.toContain(user3.email)
    expect(agreement.activeGithubIds).toContain(user2.githubId)
    expect(agreement.activeGithubIds).not.toContain(user3.githubId)
  })
})
