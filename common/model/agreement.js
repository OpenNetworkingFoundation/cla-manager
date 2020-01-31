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
   * agreement, if {@link type} is {@link agreementType.CORPORATE}, otherwise
   * {@code null}
   * @param {string} body the agreement text body
   * @param {user} signer the signer of the agreement
   * @param {string|null} organization organization covered by the
   */
  constructor (type, body, signer, organization = null) {
    this._id = null
    this._dateSigned = new Date()

    this._type = type
    this._body = body
    // TODO validate that signer is of type User
    this._signer = signer

    // TODO validate that type is of type AgreementType
    // TODO if type is CORPORATE make sure organization is filled
    if (type === AgreementType.CORPORATE && organization == null) {
      throw TypeError(`Agreement.type is ${type} and organization is missing`)
    }
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

  toJson () {
    const json = {
      dateSigned: this._dateSigned,
      type: this._type,
      body: this._body,
      signer: this._signer.data(),
    }
    if (this._type === AgreementType.CORPORATE) {
      json.organization = this._organization
    }
    return json
  }

  save () {
    return DB.connection().collection(agreementCollection)
      .add(this.toJson())
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
