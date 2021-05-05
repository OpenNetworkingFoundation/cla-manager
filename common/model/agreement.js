import DB from '../db/db'
import { Addendum } from './addendum'
import { Identity } from './identity'
import { Whitelist } from './whitelists'

const agreementCollection = 'agreements'

/**
 * Returns a string that uniquely identifies the given identity in a whitelist.
 * @param identity {Identity}
 * @returns {string}
 */
function identityKey (identity) {
  return `${identity.type}:${identity.value}`
}

/**
 * Types of agreements.
 * @type {{INSTITUTIONAL: string, INDIVIDUAL: string}}
 */
const agreementType = {
  /**
   * Individual CLA.
   */
  INDIVIDUAL: 'individual',
  /**
   * Institutional CLA.
   */
  INSTITUTIONAL: 'institutional'
}

/**
 * Agreement model class.
 */
class agreement {
  /**
   * Creates a new agreement.
   * @param {agreementType} type type of agreement
   * @param {string} body the agreement text body
   * @param {Identity} signer the signer of the agreement
   * @param {string|null} organization organization covered by this agreement
   * @param {string|null} organizationAddress organization address
   * @param {Date|null} dateSigned date on which this agreement has been signed (null if we're creating it)
   */
  constructor (type, body, signer, organization = null, organizationAddress = null, dateSigned = null) {
    this._id = null
    this._type = type
    this._body = body
    this._signer = signer

    // Optional arguments default to null
    if (type === AgreementType.INSTITUTIONAL && organization == null) {
      throw TypeError(`Agreement.type is ${type} and organization is missing`)
    }
    this._organization = organization

    if (type === AgreementType.INSTITUTIONAL && organizationAddress == null) {
      throw TypeError(`Agreement.type is ${type} and organizationAddress is missing`)
    }
    this._organizationAddress = organizationAddress

    // If dateSigned is null this is a new agreement, so create a date, otherwise use the provided one
    if (dateSigned !== null) {
      this._dateSigned = dateSigned
    } else {
      this._dateSigned = new Date()
    }
  }

  /**
   * Returns the agreement ID.
   * @returns {string}
   */
  get id () {
    return this._id
  }

  /**
   * Returns the agreement type.
   * @returns {AgreementType}
   */
  get type () {
    return this._type
  }

  /**
   * Returns the organization.
   * @returns {string}
   */
  get organization () {
    return this._organization
  }

  /**
   * Returns the organization address.
   * @returns {string}
   */
  get organizationAddress () {
    return this._organizationAddress
  }

  /**
   * Returns the body.
   * @returns {string}
   */
  get body () {
    return this._body
  }

  /**
   * Returns the signer.
   * @returns {Identity}
   */
  get signer () {
    return this._signer
  }

  /**
   * Returns the signing date.
   * @returns {Date}
   */
  get dateSigned () {
    return this._dateSigned
  }

  /**
   * Returns the model in JSON compatible format.
   * @returns {Object}
   */
  toJson () {
    const json = {
      dateSigned: this._dateSigned,
      type: this._type,
      body: this._body,
      signer: this._signer.toJson()
    }
    if (this._type === AgreementType.INSTITUTIONAL) {
      json.organization = this._organization
      json.organizationAddress = this._organizationAddress
    }
    return json
  }

  /**
   * Saves the agreement into Firestore and returns the saved instance with
   * non-null id.
   * @returns {Promise<Agreement>}
   */
  save () {
    return DB.connection().collection(agreementCollection)
      .add(this.toJson())
      .then(res => {
        this._id = res.id
        return this
      })
  }

  /**
   * Returns a list of Addendum associated with this list
   * @param {AddendumType}  type  The type of addendums to load
   * @returns {Promise<Addendum[]>}
   */
  getAddendums (type) {
    return Addendum.get(this, type)
  }

  /**
   * Returns all identities that are allowed to contribute under this
   * agreement. The implementation emulates the logic used by the Firebase
   * function to update the whitelist collection in the DB.
   * @param {AddendumType}  type  The type of addendums to load
   * @returns {Promise<Identity[]>}
   */
  getWhitelist (type) {
    return this.getAddendums(type).then(addendums => {
      const whitelistMap = addendums.reduce((map, addendum) => {
        addendum.added.forEach(i => map.set(identityKey(i), i))
        addendum.removed.forEach(i => map.delete(identityKey(i)))
        return map
      }, new Map())
      return Array.from(whitelistMap.values())
    })
  }

  /**
   * Converts from firestore format to Agreement
   * @returns {Agreement}
   */
  static fromDocumentSnapshot (doc) {
    const data = doc.data()
    const signer = Identity.fromJson(data.signer)
    const dateSigned = new Date(data.dateSigned.seconds * 1000)
    // TODO: create new signer class that extends Identity and provides
    //  additional attributes such as title and phone numbe
    // For now augment instance with missing keys so we can show them in the UI.
    signer.title = data.signer.title
    signer.phoneNumber = data.signer.phoneNumber
    let a
    if (data.type === AgreementType.INDIVIDUAL) {
      a = new Agreement(data.type, data.body, signer, null, null, dateSigned)
    } else if (data.type === AgreementType.INSTITUTIONAL) {
      a = new Agreement(data.type, data.body, signer, data.organization, data.organizationAddress, dateSigned)
    }
    a._id = doc.id
    return a
  }

  static subscribe (email, successCb, errorCb) {
    const success = (data) => {
      Whitelist.getByManager(email)
        .then(agreementIds => {
          if (agreementIds.length > 0) {
            // fetch all the agreements for which I'm manager
            return Agreement.getByIds(agreementIds)
          }
          return []
        })
        .then(managed => {
          successCb([...data.docs, ...managed])
        })
        .catch(errorCb)
    }

    return DB.connection().collection(agreementCollection)
      .where('signer.value', '==', email)
      .onSnapshot(success, errorCb)
  }

  /**
   * Gets the agreements by multiple IDs
   * @param {string[]} agreementIds
   * @returns {Promise<Agreement[]>}
   */
  static getByIds (agreementIds) {
    const itemRefs = agreementIds.map(id => {
      return DB.connection().collection(agreementCollection).doc(id).get()
    })
    return Promise.all(itemRefs)
  }

  /**
   * Gets an agreement from firestore
   * @returns {Promise<Agreement>}
   */
  static get (agreementId) {
    return DB.connection().collection(agreementCollection)
      .doc(agreementId)
      .get()
      .then(Agreement.fromDocumentSnapshot)
  }

  /**
   * Gets all the agreements from firestore
   * @returns {Promise<Agreement[]>}
   */
  static list () {
    return DB.connection().collection(agreementCollection)
      .get()
      .then(res => {
        return res.docs.map(i => Agreement.fromDocumentSnapshot(i))
      })
  }
}

export const Agreement = agreement
export const AgreementType = agreementType
