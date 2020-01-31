import DB from '../db/db'

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
   * @param {string} id global identifier
   * @param {AddendumType} type type of addendum
   * @param {string} agreementId ID of the agreement to which this addendum applies
   * @param {User} signer signer  of the addendum
   * @param {User[]} added array of users added by the addendum
   * @param {User[]} removed array of users removed by the addendum
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
   * @returns {User}
   */
  get signer () {
    return this._signer
  }

  /**
   * Returns the added users.
   * @returns {User[]}
   */
  get added () {
    return this._added
  }

  /**
   * Returns the removed users.
   * @returns {User[]}
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

  save () {
    const data = {
      signer: this.signer,
      added: this.added,
      removed: this.removed,
      agreementId: this.agreementId,
      dateSigned: this._dateSigned
    }

    console.info('Sending data to FirebaseDB:', data)

    return DB.connection().collection(addendumCollection)
      .add(data)
      .then(res => {
        this._id = res.id
        return this
      })
  }

  static get (agreementId) {
    return DB.connection().collection(addendumCollection)
      .where('agreementId', '==', agreementId)
      .get()
  }
}

export const Addendum = addendum
export const AddendumType = addendumType
