
export const IdentityType = {
  UNKNOWN: 'unknown',
  MAIL: 'mail',
  GITHUB: 'github'
}

/**
 * Identity model class.
 * This class is used to associate identities to Addendum
 */
export class Identity {
  /**
   * Creates a new Identity.
   * @param {IdentityType} type the type of the identity
   * @param {string} name name of the  user
   * @param {string} value the identifier for this identity
   */

  constructor (type, name, value) {
    this._type = type
    this._name = name
    this._value = value
  }

  /**
   * Returns the type.
   *
   * @returns {IdentityType}
   */
  get type () {
    return this._type
  }

  /**
   * Returns the name.
   *
   * @returns {string}
   */
  get name () {
    return this._name
  }

  /**
   * Returns the value.
   *
   * @returns {string}
   */
  get value () {
    return this._value
  }

  /**
   * Returns the value in JSON format.
   *
   * @returns {Object}
   */
  toJson () {
    return Object.keys(this).reduce((d, k) => {
      if (this[k]) {
        d[k.replace('_', '')] = this[k]
      }
      return d
    }, {})
  }
}
