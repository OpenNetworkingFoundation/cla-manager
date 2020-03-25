import { Addendum, AddendumType } from './addendum'
import { Identity, IdentityType } from './identity'
import FirestoreMock from '../test_helpers/firestore.mock'
import DB from '../db/db'

const signer = new Identity(IdentityType.EMAIL, 'John', 'john@onf.dev')
const contributor1 = new Identity(IdentityType.EMAIL, 'Emma', 'emma@onf.dev')
const contributor2 = new Identity(IdentityType.EMAIL, 'Gigi', 'gigi@onf.dev')
const contributor3 = new Identity(IdentityType.GITHUB, 'Alex', 'alex3000')

describe('The Addendum model', () => {
  const firestoreMock = new FirestoreMock()
  let model
  beforeEach(() => {
    const DBSpy = jest.spyOn(DB, 'connection').mockImplementation(() => firestoreMock)
    DBSpy.mockClear()
    firestoreMock.reset()

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

  describe('the list method', () => {
    it('should return all the agreements in the DB', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [contributor1, contributor2], []).toJson() },
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [contributor1, contributor3], [contributor1]).toJson() }
        ]
      }

      Addendum.list()
        .then(res => {
          expect(res[0].type).toEqual(AddendumType.CONTRIBUTOR)
          expect(res[0].agreementId).toEqual('test-id')
          expect(res[0].signer).toEqual(signer)
          expect(res[0].added).toEqual([contributor1, contributor2])
          expect(res[0].removed).toEqual([])

          expect(res[1].type).toEqual(AddendumType.CONTRIBUTOR)
          expect(res[1].agreementId).toEqual('test-id')
          expect(res[1].signer).toEqual(signer)
          expect(res[1].added).toEqual([contributor1, contributor3])
          expect(res[1].removed).toEqual([contributor1])

          done()
        })
        .catch(done)
    })
  })
})
