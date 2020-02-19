import DB from '../db/db'

import FirestoreMock from '../test_helpers/firestore.mock'

import { Agreement, AgreementType } from './agreement'
import { Addendum, AddendumType } from './addendum'
import { Identity, IdentityType } from './identity'

const signer = new Identity(IdentityType.EMAIL, 'John', 'john@onf.dev')
const user1 = new Identity(IdentityType.EMAIL, 'Felix', 'felix@onf.dev')
const user2 = new Identity(IdentityType.EMAIL, 'Martha', 'martha@onf.dev')
const user3 = new Identity(IdentityType.EMAIL, 'Felipe', 'felipe@onf.dev')

describe('The Agreement model', () => {
  let individualAgreement, corporateAgreement
  const firestoreMock = new FirestoreMock()

  beforeEach(() => {
    const DBSpy = jest.spyOn(DB, 'connection').mockImplementation(() => firestoreMock)
    DBSpy.mockClear()
    firestoreMock.reset()

    individualAgreement = new Agreement(
      AgreementType.INDIVIDUAL,
      'TODO, add agreement body',
      signer
    )

    corporateAgreement = new Agreement(
      AgreementType.CORPORATE,
      'TODO, add agreement body',
      signer,
      'ONF',
      '1000 El Camino Real, 94025 Menlo Park (CA)'
    )
  })

  it('should correctly instantiate the class for INDIVIDUAL', () => {
    expect(individualAgreement.id).toEqual(null)
    expect(individualAgreement.type).toEqual(AgreementType.INDIVIDUAL)
    expect(individualAgreement.signer.email).toEqual(signer.email)
    expect(individualAgreement.signer.name).toEqual(signer.name)
    expect(individualAgreement.organization).toEqual(null)
  })

  it('should correctly instantiate the class for CORPORATE', () => {
    expect(corporateAgreement.id).toEqual(null)
    expect(corporateAgreement.type).toEqual(AgreementType.CORPORATE)
    expect(corporateAgreement.signer.email).toEqual(signer.email)
    expect(corporateAgreement.signer.name).toEqual(signer.name)
    expect(corporateAgreement.organization).toEqual('ONF')
    expect(corporateAgreement.organizationAddress).toEqual('1000 El Camino Real, 94025 Menlo Park (CA)')
  })

  it('should not instantiate the class for CORPORATE if organization is missing', function () {
    const create = () => {
      corporateAgreement = new Agreement(
        AgreementType.CORPORATE,
        'TODO, add agreement body',
        signer
      )
    }
    expect(create).toThrow(TypeError)
  })

  describe('the toJson method', function () {
    it('should return a JSON object for the individualAgreement', () => {
      const json = individualAgreement.toJson()
      expect(json instanceof Object).toBe(true)

      expect(json.type).toEqual(AgreementType.INDIVIDUAL)
      expect(json.signer.email).toEqual(signer.email)
      expect(json.signer.name).toEqual(signer.name)
      expect(json.organization).toBe(undefined)
    })

    it('should return a JSON object for the corporateAgreement', () => {
      const json = corporateAgreement.toJson()
      expect(json instanceof Object).toBe(true)

      expect(json.type).toEqual(AgreementType.CORPORATE)
      expect(json.signer.email).toEqual(signer.email)
      expect(json.signer.name).toEqual(signer.name)
      expect(json.organization).toBe('ONF')
      expect(json.organizationAddress).toEqual('1000 El Camino Real, 94025 Menlo Park (CA)')
    })
  })

  describe('the save method', () => {
    it('should store a individualAgreement in the database', (done) => {
      firestoreMock.mockAddReturn = { id: 'test-id' }
      individualAgreement.save()
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollection).toBeCalledWith('agreements')
          expect(firestoreMock.mockAdd).toBeCalledWith({
            body: 'TODO, add agreement body',
            signer: individualAgreement.signer.toJson(),
            type: individualAgreement.type,
            dateSigned: individualAgreement.dateSigned
          })
          expect(res.id).toEqual('test-id')
          done()
        })
        .catch(done)
    })
  })

  describe('the getAddendums method', () => {
    it('should return a list of addendums', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user2], []).toJson() },
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user3], [user1]).toJson() }
        ]
      }
      individualAgreement.getAddendums()
        .then(res => {
          expect(firestoreMock.mockWhere).toBeCalledWith('signer.value', '==', signer.value)
          expect(firestoreMock.mockWhere).toBeCalledWith('agreementId', '==', null)
          expect(res.length).toEqual(2)
          expect(res[0].added.length).toEqual(2)
          expect(res[0].removed.length).toEqual(0)
          expect(res[1].added.length).toEqual(2)
          expect(res[1].removed.length).toEqual(1)
          done()
        })
        .catch(done)
    })
  })

  describe('the getWhitelist method', () => {
    it('should return a list of valid users for an agreement ', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user2], []).toJson() },
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user3], [user1]).toJson() }
        ]
      }
      individualAgreement.getWhitelist()
        .then(res => {
          expect(res.length).toEqual(2)
          // NOTE user1 is removed in the second addendum
          expect(res[0]).toEqual(user2)
          expect(res[1]).toEqual(user3)
          done()
        })
        .catch(done)
    })
  })

  describe('the subscriber method', () => {
    it('should get a list of models from the DB', (done) => {
      firestoreMock.mockOnSnaptshotSuccess = []
      const email = 'info@onf.org'
      Agreement.subscribe(
        email,
        res => {
          expect(firestoreMock.mockWhere).toBeCalledWith('signer.type', '==', 'email')
          expect(firestoreMock.mockWhere).toBeCalledWith('signer.value', '==', 'info@onf.org')
          expect(res).toEqual([])
          done()
        },
        err => {
          done(err)
        }
      )
    })
  })
})
