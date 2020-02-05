/**
 * Returns a string that uniquely identifies the given identity object.
 * @param identityObj {{type: string, value: string}}
 * @returns {string}
 */
module.exports.identityKey = function (identityObj) {
  if (!identityObj || !('type' in identityObj) || !('value' in identityObj)) {
    throw new Error('Invalid identity object')
  }
  const lcValue = identityObj.value.toLowerCase()
  return `${identityObj.type}:${lcValue}`
}

/**
 * Returns an identity object with type and value from the given key.
 * @param identityKey {string}
 * @returns {{type: string, value: string}}
 */
module.exports.identityObj = function (identityKey) {
  if (!identityKey) {
    throw new Error('Identity key is falsy')
  }
  if (!(typeof identityKey === 'string' || identityKey instanceof String)) {
    throw new Error('Invalid identity key is not a string')
  }
  const i = identityKey.indexOf(':')
  if (i < 0) {
    throw new Error('Invalid identity key')
  }
  return {
    type: identityKey.slice(0, i),
    value: identityKey.slice(i + 1)
  }
}
