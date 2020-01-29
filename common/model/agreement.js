import DB from '../db/db'

const agreementCollection = 'agreements'

/**
 * Types of agreements.
 * @type {{CORPORATE: string, INDIVIDUAL: string}}
 */
const agreementType = {
  /**
   * Individual CLA.
   */
  INDIVIDUAL: 'individual',
  /**
   * Corporate CLA.
   */
  CORPORATE: 'corporate'
}

/**
 * Agreement model class.
 */
class agreement {
  /**
   * Creates a new agreement.
   * @param {agreementType} type type of agreement
   * @param {organization|null} organization organization covered by the
   * agreement, if {@link type} is {@link agreementType.CORPORATE}, otherwise
   * {@code null}
   * @param {string} body the agreement text body
   * @param {user} signer the signer of the agreement
   */
  constructor (type, body, signer, organization = null) {
    this._id = null
    this._dateSigned = new Date()
    // TODO validate that type is of type AgreementType
    // TODO if type is CORPORATE make sure organization is filled
    this._type = type
    this._body = body
    // TODO validate that signer is of type User
    this._signer = signer
    // organization is an optional parameter, defaults to null
    this._organization = organization
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
   * @returns {Organization}
   */
  get organization () {
    return this._organization
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
   * @returns {User}
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

  save () {
    const data = {
      signer: this._signer,
      type: this._type,
      dateSigned: this.dateSigned
    }
    if (this._organization) {
      data.organization = this._organization
    }

    console.info('Sending data to FirebaseDB:', data)

    return DB.connection().collection(agreementCollection)
      .add(data)
      .then(res => {
        this._id = res.id
        return res
      })
  }

  static subscribe (email, successCb, errorCb) {
    return DB.connection().collection(agreementCollection)
      .where('signer.email', '==', email)
      .onSnapshot(successCb, errorCb)
  }
}

export const Agreement = agreement
export const AgreementType = agreementType
