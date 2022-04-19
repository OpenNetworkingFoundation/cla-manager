const firebase = require('@firebase/rules-unit-testing');
const fs = require('fs');
var assert = require('assert');

/*
 * ============
 *    Setup
 * ============
 */
const projectId = 'firestore-emulator-example';
const firebaseJson = __dirname + '/../firebase.json';
const firebasePort = require(firebaseJson).emulators.firestore.port;
const coverageUrl = `http://localhost:${firebasePort}/emulator/v1/projects/${projectId}:ruleCoverage.html`;

const rules = fs.readFileSync('firestore.rules', 'utf8');

/**
 * Creates a new app with authentication data matching the input.
 *
 * @param {object} auth is the object received in request.auth.token
 * @returns {firebase.firestore.Firestore} the app.
 */
function authedApp(auth) {
  return firebase.initializeTestApp({ projectId, auth }).firestore();
}

/**
 * Creates an app with admin privileges, used to populated the DB during the setup
 * @returns {firebase.firestore.Firestore}
 */
function adminApp () {
  return firebase.initializeAdminApp({projectId}).firestore();
}

/*
 * =============
 *   Constants
 * =============
 */

const agreementCollection = 'agreements'
const addendumCollection = 'addendums'
const whitelistCollection = 'whitelists'
const appuserCollection = 'appUsers'
const accountsCollection = 'accounts'

const AdminUser = {
  uid: 'admin',
  admin: true,
  email: 'admin@onf.org'
}

const AuthenticatedOwner = {
  uid: 'autheticatedOwner',
  email: 'authenticatedOwner@onf.org'
}

const AuthenticatedManager = {
  uid: 'autheticatedManager',
  email: 'authenticatedManager@onf.org'
}

/*
 * =============
 *     TEST
 * =============
 */
describe('CLAM Firestore rules TestSuite', () => {

  beforeEach(async () => {
    // Clear the database between tests
    await firebase.clearFirestoreData({ projectId });
  });

  before(async () => {
    await firebase.loadFirestoreRules({ projectId, rules });
  });

  after(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
    console.log(`View rule coverage information at ${coverageUrl}\n`);
  });

  describe('AppUsers', () => {
    let admin, ownerDb, appUsers;
    beforeEach(async () => {
      admin = adminApp();
      ownerDb = authedApp(AuthenticatedOwner);

      await admin.collection(appuserCollection).doc(AuthenticatedOwner.uid).set({
        accounts: ['foo', 'bar'],
      });

      await admin.collection(appuserCollection).doc(AuthenticatedManager.uid).set({
        accounts: ['foo', 'bar'],
      });
    });

    it('should be allowed to read its own AppUser.accounts', async () => {
      await firebase.assertSucceeds(ownerDb.collection(appuserCollection).doc(AuthenticatedOwner.uid)
        .collection(accountsCollection).get())
    });

    it('should not be allowed to read someone else\'s AppUser.accounts', async () => {
      await firebase.assertSucceeds(ownerDb.collection(appuserCollection).doc(AuthenticatedOwner.uid)
        .collection(accountsCollection).get())
    });
  });

  describe('when a user is logged in as admin', () => {

    let db, myAgreement, otherAgreement;

    beforeEach(async () => {
      db = authedApp(AdminUser);
      const app = adminApp();

      myAgreement = await app.collection(agreementCollection).add({
        signer: {value: AdminUser.email},
      })

      otherAgreement = await app.collection(agreementCollection).add({
        signer: {value: 'non-admin@onf.org'},
      })

      // this entry in the whitelist is only used to test that the Admin can read it
      await app.collection(whitelistCollection).doc("foo").set({
        values: ['email:wl1@opennetworking.org', 'email:foo@opennetworking.org']
      }, { merge: true })
    })

    it('should be allowed to list all the Agreements', async () => {
      const agreements = db.collection(agreementCollection);
      const query = agreements.get();
      const res = await firebase.assertSucceeds(query);
      assert.strictEqual(res.docs.length, 2);
    });

    it('should be allowed to create an addendum for Agreements he does own', async () => {
      const addendum = {
        signer: {value: AdminUser.email},
        agreementId: myAgreement.id
      }

      await firebase.assertSucceeds(db.collection(addendumCollection).add(addendum))
    });

    it('should not be allowed to create an addendum for Agreements he does not own', async () => {
      const addendum = {
        signer: {value: AdminUser.email},
        agreementId: otherAgreement.id
      }

      await firebase.assertFails(db.collection(addendumCollection).add(addendum))
    });
    
    it('should be allowed to list all the identities', async () => {
      const whitelist = db.collection(whitelistCollection);
      const query = whitelist.get();
      const res = await firebase.assertSucceeds(query);
      assert.strictEqual(res.docs.length, 1);
    });

    it('should be allowed to read someone else\'s AppUser.accounts', async () => {
      await firebase.assertSucceeds(db.collection(appuserCollection).get())
      await firebase.assertSucceeds(db.collection(appuserCollection).doc(AuthenticatedOwner.uid)
        .collection(accountsCollection).get())
    });
  });

  describe('when a user is logged', () => {
    let app, ownerDb, agreements, testAgreement;

    beforeEach(async () => {
      ownerDb = authedApp(AuthenticatedOwner);
      agreements = ownerDb.collection(agreementCollection);

      app = adminApp();
      // create Agreements belonging to other users
      testAgreement = await app.collection(agreementCollection).add({
        signer: {value: AdminUser.email},
      })
      await app.collection(agreementCollection).add({
        signer: {value: AdminUser.email},
      })

      // create an agreement for the authenticated user
      await app.collection(agreementCollection).add({
        signer: {value: AuthenticatedOwner.email}
      })

    });

    it('should only be allowed to list his own Agreements', (done) => {

      const queryAll = agreements.get();
      firebase.assertFails(queryAll);

      const queryMine = agreements.where('signer.value', '==', AuthenticatedOwner.email).get();
      firebase.assertSucceeds(queryMine);
      queryMine.then(res => {
        assert.strictEqual(res.docs.length, 1);
        done();
      });
    });

    it('should be allowed to create Agreements only if he signed them', async () => {
      await firebase.assertSucceeds(agreements.add({
        signer: {value: AuthenticatedOwner.email}
      }));

      await firebase.assertFails(agreements.add({
        signer: {value: 'random@ong.org'}
      }));

    });

    describe('and is a co-signer of an Agreement', () => {

      let managerDb;

      beforeEach(async () => {
        managerDb = authedApp(AuthenticatedManager);
        await app.collection(addendumCollection).add({
          type: 'manager',
          agreementId: testAgreement.id,
          added: [
            {value: AuthenticatedOwner.email}
          ]
        });

        // create a whitelist entry that sets AuthenticatedOwner as manager for the testAgreement
        await app.collection(whitelistCollection).doc(testAgreement.id).set({
          managers: [AuthenticatedManager.email]
        }, { merge: true })

        const query = await app.collection(whitelistCollection).get()
      });

      it('should be able to list those Agreements', async () => {

        // get all the agreements this user can manage from the whitelist
        const query = await managerDb.collection(whitelistCollection)
          .where('managers', 'array-contains', AuthenticatedManager.email)
          .get()
        firebase.assertSucceeds(query)
        assert.strictEqual(query.docs.length, 1)

        // query for those agreements
        const managedIds = query.docs.reduce((ids, d) => [d.id, ...ids], [])
        let itemRefs = managedIds.map(id => {
          return managerDb.collection(agreementCollection).doc(id).get();
        });
        const agreementsQuery = await Promise.all(itemRefs)
        firebase.assertSucceeds(agreementsQuery)
        assert.strictEqual(agreementsQuery.length, 1)
      });

      it('should be able to read those Agreements', (done) => {
        managerDb.collection(whitelistCollection)
          .where('managers', 'array-contains', AuthenticatedManager.email)
          .get()
          .then(agreements => {
            return agreements.docs.reduce((promises, a) => {
              const query = managerDb.collection(agreementCollection).doc(a.id).get()
              firebase.assertSucceeds(query)
              promises.push(query)
              return promises
            }, [])
          })
          .then(promises => {
            return Promise.all(promises)
              .then(res => {
                // we only have one agreement on which AuthenticatedManager is listed as a manager
                const a = res[0].data()
                assert.strictEqual(a.signer.value, AdminUser.email)
                done()
              })
          })
          .catch(done)

      });

      it('should be allowed to create Addendums for that Agreement', async () => {

        const addendum = {
          signer: {value: AuthenticatedManager.email},
          agreementId: testAgreement.id
        }

        await firebase.assertSucceeds(managerDb.collection(addendumCollection).add(addendum));
      });

      it('should be allowed to read Addendums for that Agreement', async () => {
        const query = await managerDb.collection(addendumCollection)
          .where('agreementId', '==', testAgreement.id)
          .get()

        firebase.assertSucceeds(query)
      });
    });
  });
});