import DB from '../db/db'

import { Agreement, AgreementType, AgreementCollection } from './agreement'
import { User } from './user'
import { Addendum, AddendumCollection, AddendumType } from './addendum'

jest.mock('../db/db', () => jest.fn())

const signer = new User('John', 'john@onf.dev', 'john')
const user1 = new User('Felix', 'felix@onf.dev', 'felix')
const user2 = new User('Martha', 'martha@onf.dev', 'martha')
const user3 = new User('Felipe', 'felipe@onf.dev', 'felipe')

const mockOnSnapshot = jest.fn((success) => {
  // TODO return data
  // TODO mock errors too
  return success([])
})

const mockAgreementAdd = jest.fn(() => {
  return Promise.resolve({ id: 'test-id' })
})

const mockAgreementWhere = jest.fn(() => {
  return {
    onSnapshot: mockOnSnapshot
  }
})

const mockAddendumGet = jest.fn(() => {
  const addendums = [
    new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user2], []).toJson(),
    new Addendum(AddendumType.CONTRIBUTOR, 'test-id', signer, [user1, user3], [user1]).toJson()
  ]
  return Promise.resolve(addendums)
})

const mockAddendumWhere = jest.fn(() => {
  return {
    get: mockAddendumGet
  }
})

const mockCollection = jest.fn((collection) => {
  if (collection === AgreementCollection) {
    return {
      add: mockAgreementAdd,
      where: mockAgreementWhere
    }
  } else if (collection === AddendumCollection) {
    return {
      where: mockAddendumWhere
    }
  }
})

const mockConnection = jest.fn(() => {
  return {
    collection: mockCollection
  }
})

DB.connection = mockConnection

describe('The Agreement model', () => {
  let individualAgreement, corporateAgreement

  beforeEach(() => {
    DB.mockClear()

    individualAgreement = new Agreement(
      AgreementType.INDIVIDUAL,
      'TODO, add agreement body',
      signer
    )

    corporateAgreement = new Agreement(
      AgreementType.CORPORATE,
      'TODO, add agreement body',
      signer,
      'ONF'
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
    })
  })

  describe('the save method', () => {
    it('should store a individualAgreement in the database', () => {
      individualAgreement.save()
      expect(DB.connection).toHaveBeenCalledTimes(1)
      expect(mockCollection).toBeCalledWith('agreements')
      expect(mockAgreementAdd).toBeCalledWith({
        body: 'TODO, add agreement body',
        signer: individualAgreement.signer.data(),
        type: individualAgreement.type,
        dateSigned: individualAgreement.dateSigned
      })
    })
  })

  describe('the getAddendums method', () => {
    it('should return a list of addendums', (done) => {
      individualAgreement.getAddendums()
        .then(res => {
          expect(res.length).toEqual(2)
          expect(res[0].added.length).toEqual(2)
          expect(res[0].removed.length).toEqual(0)
          expect(res[1].added.length).toEqual(1)
          expect(res[1].removed.length).toEqual(1)
          done()
        })
        .catch(done)
    })
  })

  describe('the getActiveUser method', () => {
    it('should return a list of valid users for an agreement ', (done) => {
      individualAgreement.getActiveUser()
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
      const email = 'info@onf.org'
      Agreement.subscribe(
        email,
        res => {
          expect(mockAgreementWhere).toBeCalledWith('signer.email', '==', email)
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
