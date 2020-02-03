import { Identity, IdentityType } from './identity'

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
