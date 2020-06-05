import DB from '../db/db'
import { Firebase } from '../app/app'

const userCollection = 'appUsers'
const accountsCollection = 'accounts'

/**
 * App user model class.
 * TODO: clean up and doc
 */
export class AppUser {
  /**
   * Creates a new user.
   */
  constructor (uid) {
    this._uid = uid
  }

  /**
   * Returns the user ID.
   * @returns {string}
   */
  get uid () {
    return this._uid
  }

  static current () {
    const firebaseUser = Firebase.auth().currentUser
    if (!firebaseUser) {
      throw new Error('user not signed in')
    }
    return new AppUser(firebaseUser.uid)
  }

  deleteAccount (id) {
    console.debug(`Deleting account ${id}...`)
    return DB.connection().collection(userCollection)
      .doc(this._uid)
      .collection(accountsCollection)
      .doc(id)
      .delete()
  }

  subscribeAccounts (successCb, errorCb) {
    return DB.connection().collection(userCollection)
      .doc(this._uid)
      .collection(accountsCollection)
      .onSnapshot(next => {
        successCb(next.docs.map(AppUser.accountFromSnapshot))
      }, errorCb)
  }

  static accountFromSnapshot (doc) {
    const data = doc.data()
    data.id = doc.id
    return data
  }
}
