import DB from '../db/db'
import { Addendum } from './addendum'

const whitelistCollection = 'whitelists'

// FIXME duplicate
function identityKey (identity) {
  return `${identity.type}:${identity.value}`
}

/**
 * Whitelist model class.
 * This class is used as a cache to keep track of all the valid identities per Agreement
 */
export class Whitelist {
  /**
   * Creates a new whitelist.
   * @param {string} id the firebase ID
   * @param {date} lastUpdated when the whitelist was updated the last time
   * @param {string[]} values all the valid identities for the agreement
   */
  constructor (id, lastUpdated, values) {
    this._id = id
    this._lastUpdated = lastUpdated
    this._values = values
  }

  /**
   * Returns the whitelist id.
   * @returns {string}
   */
  get id () {
    return this._id
  }

  /**
   * Returns the whitelist updated date.
   * @returns {date}
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
    return new Whitelist(doc.id, new Date(doc.data().lastUpdated.seconds * 1000), doc.data().values)
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

  /**
   * Get all the whitelisted identities with their Agreement ID
   * @returns {*}
   */
  static getWhitelistWithAgreementId () {
    const identityMap = {}
    return Whitelist.list()
      .then(whitelist => {
        whitelist.forEach(entry => {
          entry.values.forEach(identity => {
            if (!identityMap[identity]) {
              identityMap[identity] = []
            }
            identityMap[identity].push(entry.id)
          })
        })
        return Object.keys(identityMap).reduce((list, key) => {
          list.push({ identity: key.split(':')[1], agreements: identityMap[key] })
          return list
        }, [])
      })
  }
}
