import { Identity, IdentityType } from './identity'

// define a custom validator for whitespaces
expect.extend({
  toHaveWhitespaces (received) {
    const pass = (received.indexOf(' ') !== -1)
    if (pass) {
      return {
        pass: true,
        message: () => `expected "${received}" not to have whitespaces`
      }
    } else {
      return {
        pass: false,
        message: () => `expected "${received}" to have whitespaces`
      }
    }
  }
})

describe('The Identity model', () => {
  let emailModel, githubModel
  beforeEach(() => {
    emailModel = new Identity(IdentityType.EMAIL, 'emailModel', 'foo@gmail.com')
    githubModel = new Identity(IdentityType.GITHUB, 'githubModel', 'githubId')
  })

  it('should instantiate the correct models', () => {
    expect(emailModel.type).toEqual(IdentityType.EMAIL)
    expect(emailModel.name).toEqual('emailModel')
    expect(emailModel.value).toEqual('foo@gmail.com')

    expect(githubModel.type).toEqual(IdentityType.GITHUB)
    expect(githubModel.name).toEqual('githubModel')
    expect(githubModel.value).toEqual('githubId')
  })

  it('should trim whitespaces from values', () => {
    const contributorWithSpaces = new Identity(IdentityType.GITHUB, 'Mike', '   i-have-some-spaces   ')

    expect(contributorWithSpaces.value).not.toHaveWhitespaces()
  })

  it('should not accept an invalid type', function () {
    const makeModel = () => new Identity('foo', 'bar', 'error')
    expect(makeModel).toThrow(TypeError)
  })

  describe(`when the type is ${IdentityType.EMAIL}`, () => {
    it('should not accept a value that is not a proper email', () => {
      const makeModel = () => new Identity(IdentityType.EMAIL, 'bar', 'notanemailaddress')
      expect(makeModel).toThrow(TypeError)
    })
  })
})
