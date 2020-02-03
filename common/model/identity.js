export const IdentityType = {
  // UNKNOWN: 'unknown',
  EMAIL: 'email',
  GITHUB: 'github'
}

function validateEmail (email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

/**
 * Identity model class.
 * This class is used to associate identities to Addendum
 */
export class Identity {
  /**
   * Creates a new Identity.
   * @param {IdentityType} type the type of the identity
   * @param {string} name name of the user
   * @param {string} value the identifier for this identity
   */

  constructor (type, name, value) {
    if (Identity.enumTypes().indexOf(type) === -1) {
      throw TypeError(`Type ${type} is not valid, must be one of ${Identity.enumTypes()}`)
    }

    if (type === IdentityType.EMAIL) {
      if (!validateEmail(value)) {
        throw TypeError(`${value}is not a valid email address`)
      }
    }

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

  /**
   * Returns the list ov valid IdentityTypes.
   *
   * @returns {[]string}
   */
  static enumTypes () {
    return Object.keys(IdentityType).map(k => IdentityType[k])
  }
}
