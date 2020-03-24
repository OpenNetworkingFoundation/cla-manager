import DB from '../db/db'
import { Identity, IdentityType } from './identity'

/**
 * types of agreement addendums.
 * @type {{CONTRIBUTOR: string, COSIGNER: string}}
 */

const addendumCollection = 'addendums'

const addendumType = {
  /**
   * Contributor addendum.
   */
  CONTRIBUTOR: 'contributor',
  /**
   * Cosigner addendum.
   */
  COSIGNER: 'cosigner'
}

/**
 * Agreement addendum model class.
 */
class addendum {
  /**
   * Creates a new agreement addendum.
   * @param {AddendumType} type type of addendum
   * @param {string} agreementId ID of the agreement to which this addendum
   *   applies
   * @param {Identity} signer signer of the addendum
   * @param {Identity[]} added array of identities added by the addendum
   * @param {Identity[]} removed array of identities removed by the addendum
   */
  constructor (type, agreementId, signer, added, removed) {
    this._agreementId = agreementId
    this._signer = signer
    this._added = added
    this._removed = removed
    this._type = type
    this._dateSigned = new Date()
  }

  /**
   * Returns the global identifier.
   * @returns {string}
   */
  get id () {
    return this._id
  }

  /**
   * Returns the addendum type.
   * @returns {AddendumType}
   */
  get type () {
    return this._type
  }

  /**
   * Returns the agreement ID.
   * @returns {string}
   */
  get agreementId () {
    return this._agreementId
  }

  /**
   * Returns the signer.
   * @returns {Identity}
   */
  get signer () {
    return this._signer
  }

  /**
   * Returns the added identities.
   * @returns {Identity[]}
   */
  get added () {
    return this._added
  }

  /**
   * Returns the removed identities.
   * @returns {Identity[]}
   */
  get removed () {
    return this._removed
  }

  /**
   * Returns the dateSigned.
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
    return {
      signer: this.signer.toJson(),
      added: this.added.map(i => i.toJson()),
      removed: this.removed.map(i => i.toJson()),
      agreementId: this.agreementId,
      dateSigned: this.dateSigned
    }
  }

  save () {
    console.info('Sending toJson to FirebaseDB:', this.toJson())

    return DB.connection().collection(addendumCollection)
      .add(this.toJson())
      .then(res => {
        this._id = res.id
        return this
      })
  }

  /**
   * Retrieves addendums from the DB for the given agreement
   * @param {Agreement} agreement
   * @returns {Promise<Addendum[]>}
   */
  static get (agreement) {
    return DB.connection().collection(addendumCollection)
      .where('signer.value', '==', agreement.signer.value)
      .where('agreementId', '==', agreement.id)
      .orderBy('dateSigned')
      .get()
      .then(query => Array.from(query.docs.map(Addendum.fromDocumentSnapshot)))
  }

  /**
   * Converts from firestore format to Addendum
   * @returns {Addendum}
   */
  static fromDocumentSnapshot (doc) {
    const data = doc.data()
    // Older addendums in the DB have signer with no type. Assume EMAIL is the
    // default one, which is fine since we only support that type of identity
    // for signers.
    data.signer.type = data.signer.type || IdentityType.EMAIL
    const signer = Identity.fromJson(data.signer)
    const added = data.added.map(Identity.fromJson)
    const removed = data.removed.map(Identity.fromJson)
    // Older addendums were stored in the DB without a type. Assume CONTRIBUTOR
    // as the default one.
    const type = data.type || AddendumType.CONTRIBUTOR
    return new Addendum(type, data.agreementId, signer, added, removed)
  }

  static list () {
    return DB.connection().collection(addendumCollection)
      .get()
      .then(res => {
        return res.docs.map(Addendum.fromDocumentSnapshot)
      })
  }
}

export const Addendum = addendum
export const AddendumType = addendumType
