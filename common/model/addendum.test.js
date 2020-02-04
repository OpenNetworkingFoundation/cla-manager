import { Addendum, AddendumType } from './addendum'
import { Identity, IdentityType } from './identity'

describe('The Addendum model', () => {
  let model
  let signer
  let contributor1, contributor2, contributor3
  beforeEach(() => {
    signer = new Identity(IdentityType.EMAIL, 'John', 'john@onf.dev')
    contributor1 = new Identity(IdentityType.EMAIL, 'Emma', 'emma@onf.dev')
    contributor2 = new Identity(IdentityType.EMAIL, 'Gigi', 'gigi@onf.dev')
    contributor3 = new Identity(IdentityType.GITHUB, 'Alex', 'alex3000')

    model = new Addendum(
      AddendumType.CONTRIBUTOR,
      'aabb',
      signer,
      [contributor1, contributor3],
      [contributor2]
    )
  })
  it('should correctly instantiate the class', () => {
    expect(model.type).toEqual('contributor')
    expect(model.agreementId).toEqual('aabb')
    expect(model.signer).toEqual(signer)
    expect(model.added).toEqual([contributor1, contributor3])
    expect(model.removed).toEqual([contributor2])
    expect(model.dateSigned instanceof Date).toBe(true)
  })
})
