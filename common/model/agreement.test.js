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
  let individualAgreement, institutionalAgreement
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

    institutionalAgreement = new Agreement(
      AgreementType.INSTITUTIONAL,
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

  it('should correctly instantiate the class for INSTITUTIONAL', () => {
    expect(institutionalAgreement.id).toEqual(null)
    expect(institutionalAgreement.type).toEqual(AgreementType.INSTITUTIONAL)
    expect(institutionalAgreement.signer.email).toEqual(signer.email)
    expect(institutionalAgreement.signer.name).toEqual(signer.name)
    expect(institutionalAgreement.organization).toEqual('ONF')
    expect(institutionalAgreement.organizationAddress).toEqual('1000 El Camino Real, 94025 Menlo Park (CA)')
  })

  it('should not instantiate the class for INSTITUTIONAL if organization is missing', function () {
    const create = () => {
      institutionalAgreement = new Agreement(
        AgreementType.INSTITUTIONAL,
        'TODO, add agreement body',
        signer
      )
    }
    expect(create).toThrow(TypeError)
  })

  describe('when a dateSinged is provided', () => {
    const date = new Date('05/10/2020')
    it('should correctly instantiate the class for INDIVIDUAL', () => {
      const agreement = new Agreement(
        AgreementType.INDIVIDUAL,
        'TODO, add agreement body',
        signer,
        null,
        null,
        date
      )
      expect(agreement.dateSigned).toEqual(date)
    })

    it('should correctly instantiate the class for INSTITUTIONAL', () => {
      const agreement = new Agreement(
        AgreementType.INDIVIDUAL,
        'TODO, add agreement body',
        signer,
        'ONF',
        '1000 El Camino Real, 94025 Menlo Park (CA)',
        date
      )
      expect(agreement.dateSigned).toEqual(date)
    })
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

    it('should return a JSON object for the institutionalAgreement', () => {
      const json = institutionalAgreement.toJson()
      expect(json instanceof Object).toBe(true)

      expect(json.type).toEqual(AgreementType.INSTITUTIONAL)
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
    it('should return a list of CONTRIBUTOR addendums', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user2], []).toJson() },
          { data: () => new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user3], [user1]).toJson() }
        ]
      }
      individualAgreement.getAddendums(AddendumType.CONTRIBUTOR)
        .then(res => {
          expect(firestoreMock.mockWhere).toBeCalledWith('agreementId', '==', null)
          expect(firestoreMock.mockWhere).toBeCalledWith('type', '==', AddendumType.CONTRIBUTOR)
          expect(res.length).toEqual(2)
          expect(res[0].added.length).toEqual(2)
          expect(res[0].removed.length).toEqual(0)
          expect(res[1].added.length).toEqual(2)
          expect(res[1].removed.length).toEqual(1)
          done()
        })
        .catch(done)
    })
    it('should return a list of MANAGER addendums', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { data: () => new Addendum(AddendumType.MANAGER, 'test-id', signer, [user1], []).toJson() }
        ]
      }
      individualAgreement.getAddendums(AddendumType.MANAGER)
        .then(res => {
          expect(firestoreMock.mockWhere).toBeCalledWith('agreementId', '==', null)
          expect(firestoreMock.mockWhere).toBeCalledWith('type', '==', AddendumType.MANAGER)
          expect(res.length).toEqual(1)
          expect(res[0].added.length).toEqual(1)
          expect(res[0].removed.length).toEqual(0)
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
      individualAgreement.getWhitelist(AddendumType.CONTRIBUTOR)
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

  describe('the subscribe method', () => {
    it('should get a list of models from the DB', (done) => {
      firestoreMock.mockOnSnaptshotSuccess = { docs: [] }
      firestoreMock.mockGetReturn = { docs: [] }
      const email = 'info@onf.org'
      Agreement.subscribe(
        email,
        res => {
          expect(firestoreMock.mockWhere).toBeCalledWith('managers', 'array-contains', 'info@onf.org')
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

  describe('the list method', () => {
    it('should return all the agreements in the DB', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { data: () => new Agreement(AgreementType.INDIVIDUAL, 'TODO, add agreement body', signer) },
          { data: () => new Agreement(AgreementType.INSTITUTIONAL, 'TODO, add agreement body', signer, 'ONF', '1000 El Camino Real, 94025 Menlo Park (CA)') }
        ]
      }

      Agreement.list()
        .then(res => {
          expect(res[0].type).toEqual(AgreementType.INDIVIDUAL)
          expect(res[0].signer).toEqual(signer)

          expect(res[1].type).toEqual(AgreementType.INSTITUTIONAL)
          expect(res[1].signer).toEqual(signer)
          expect(res[1].organization).toEqual('ONF')
          expect(res[1].organizationAddress).toEqual('1000 El Camino Real, 94025 Menlo Park (CA)')
          done()
        })
        .catch(done)
    })
  })
})
