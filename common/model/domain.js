import DB from '../db/db'

const domainCollection = 'domains'

/**
 * Domain model class.
 */
export class Domain {
  /**
   * Creates a new domain
   * @param {string} id id of domain
   * @param {string} name name of domain
   * @param {boolean} valid whether the domain is valid
   * @param {Date} createdOn date domain was validated
   * @param {Date|null} deletedOn date domain was invalidated (null if it is still valid)
   */
  constructor (id, name, valid, createdOn = new Date(), deletedOn = null) {
    this._id = id
    this._name = name
    this._valid = valid
    this._createdOn = createdOn
    this._deletedOn = deletedOn
  }

  /**
   * Returns the global identifier.
   * @returns {string}
   */
  get id () {
    return this._id
  }

  /**
   * Returns the name
   * @returns {string}
   */
  get name () {
    return this._name
  }

  /**
   * Returns the valid status
   * @returns {boolean}
   */
  get valid () {
    return this._valid
  }

  /**
   * Returns the date the domain was validated
   * @returns {Date}
   */
  get createdOn () {
    return this._createdOn
  }

  /**
   * Returns the date the domain was invalidated
   * @returns {Date}
   */
  get deletedOn () {
    return this._deletedOn
  }

  /**
   * Returns the model in JSON compatible format.
   * @returns {Object}
   */
  toJson () {
    return {
      name: this.name,
      valid: this.valid,
      createdOn: this.createdOn,
      deletedOn: this.deletedOn
    }
  }

  /**
   * Validates domain and send it to firestore
   * @returns {Domain}
   */
  validate () {
    console.info('Sending toJson to FirebaseDB:', this.toJson())
    return DB.connection().collection(domainCollection)
      .add(this.toJson())
      .then(res => {
        this._id = res.id
        this._createdOn = this._createdOn.toLocaleString()
        return this
      })
  }

  /**
   * Invalidates domain by id in firestore
   * @param {string} id the id of the domain to be invalidated
   * @returns {Domain}
   */
  static invalidate (id) {
    return DB.connection().collection(domainCollection)
      .doc(id)
      .update({ valid: false, deletedOn: new Date() })
  }

  /**
   * Converts from firestore format to Domain
   * @returns {Domain}
   */
  static fromDocumentSnapshot (doc) {
    const data = doc.data()
    const id = doc.id
    const name = data.name
    const valid = data.valid
    const deletedOn = data.deletedOn ? data.deletedOn.toDate().toLocaleString() : null
    const createdOn = data.createdOn.toDate().toLocaleString()
    return new Domain(id, name, valid, createdOn, deletedOn)
  }

  /**
   * Check if domain already exists in valid list
   * @returns {Promise<Boolean>}
   */
  static checkIfDomainExists (name) {
    return DB.connection().collection(domainCollection)
      .where('valid', '==', true)
      .where('name', '==', name)
      .get()
      .then(res => {
        return res.docs.length !== 0
      })
  }

  /**
   * Gets all the valid domains from firestore
   * @returns {Promise<Domain[]>}
   */
  static listValidDomains () {
    return DB.connection().collection(domainCollection)
      .where('valid', '==', true)
      .orderBy('name')
      .get()
      .then(res => {
        return res.docs.map(i => Domain.fromDocumentSnapshot(i))
      })
  }

  /**
   * Gets all the invalidated domains from firestore
   * @returns {Promise<Domain[]>}
   */
  static listInvalidDomains () {
    return DB.connection().collection(domainCollection)
      .where('valid', '==', false)
      .orderBy('name')
      .orderBy('createdOn')
      .get()
      .then(res => {
        return res.docs.map(i => Domain.fromDocumentSnapshot(i))
      })
  }
}
