const firebase = require('@firebase/testing');
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

const AdminUser = {
  uid: 'admin',
  admin: true,
  email: 'admin@onf.org'
}

const AuthenticatedUser = {
  uid: 'autheticatedUser',
  email: 'authenticated@onf.org'
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
    })

    it('should be allowed to list all the Agreements', (done) => {
      const agreements = db.collection(agreementCollection);
      const query = agreements.get();
      firebase.assertSucceeds(query);
      query.then(res => {
        assert.equal(res.docs.length, 2);
        done();
      });
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
  });

  describe('when a user is logged', () => {
    let app, db, agreements, testAgreement;

    beforeEach(async () => {
      db = authedApp(AuthenticatedUser);
      agreements = db.collection(agreementCollection);

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
        signer: {value: AuthenticatedUser.email}
      })

    });

    it('should only be allowed to list his own Agreements', (done) => {

      const queryAll = agreements.get();
      firebase.assertFails(queryAll);

      const queryMine = agreements.where('signer.value', '==', AuthenticatedUser.email).get();
      firebase.assertSucceeds(queryMine);
      queryMine.then(res => {
        assert.equal(res.docs.length, 1);
        done();
      });
    });

    it('should be allowed to create Agreements only if he signed them', async () => {
      await firebase.assertSucceeds(agreements.add({
        signer: {value: AuthenticatedUser.email}
      }));

      await firebase.assertFails(agreements.add({
        signer: {value: 'random@ong.org'}
      }));

    });

    describe('and is a co-signer of an Agreement', () => {
      beforeEach(async () => {
        await app.collection(addendumCollection).add({
          type: 'cosigner',
          agreementId: testAgreement.id,
          added: [
            {value: AuthenticatedUser.email}
          ]
        });

        // create a whitelist entry that sets AuthenticatedUser as manager for the testAgreement
        await app.collection(whitelistCollection).doc(testAgreement.id).set({
          managers: [AuthenticatedUser.email]
        }, { merge: true })
      });

      it('should be allowed to create Addendums for that Agreement', async () => {

        const addendum = {
          signer: {value: AuthenticatedUser.email},
          agreementId: testAgreement.id
        }

        console.log(testAgreement.id)

        await firebase.assertSucceeds(db.collection(addendumCollection).add(addendum))
      });
    });
  });
});