import DB from '../db/db'

const whitelistCollection = 'whitelists'

/**
 * Whitelist model class.
 * This class is used as a cache to keep track of all the valid identities per Agreement
 */
export class Whitelist {
  /**
   * Creates a new whitelist.
   * @param {date} lastUpdated when the whitelist was updated the last time
   * @param {string[]} values all the valid identities for the agreement
   */
  constructor (lastUpdated, values) {
    this._lastUpdated = lastUpdated
    this._values = values
  }

  /**
   * Returns the whitelist updated date.
   * @returns {string}
   */
  get lastUpdated () {
    return this._lastUpdated
  }

  /**
   * Returns the whitelist values.
   * @returns {AgreementType}
   */
  get values () {
    return this._values
  }

  /**
   * Converts from firestore format to Whitelist
   * @returns {Whitelist}
   */
  static fromDocumentSnapshot (doc) {
    return new Whitelist(new Date(doc.data().lastUpdated.seconds * 1000), doc.data().values)
  }

  /**
   * Gets all the whitelis from firestore
   * @returns {Promise<Whitelist[]>}
   */
  static list () {
    return DB.connection().collection(whitelistCollection)
      .get()
      .then(res => {
        return res.docs.map(i => Whitelist.fromDocumentSnapshot(i))
      })
  }
}