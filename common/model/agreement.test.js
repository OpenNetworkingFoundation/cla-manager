import DB from '../db/db'

import { Agreement, AgreementType } from './agreement'
import { User } from './user'

jest.mock('../db/db', () => jest.fn())

const mockOnSnapshot = jest.fn((success) => {
  // TODO return data
  // TODO mock errors too
  return success([])
})

const mockAdd = jest.fn(() => {
  return Promise.resolve({ id: 'test-id' })
})

const mockWhere = jest.fn(() => {
  return {
    onSnapshot: mockOnSnapshot
  }
})

const mockCollection = jest.fn(() => {
  return {
    add: mockAdd,
    where: mockWhere
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
  let signer = null

  beforeEach(() => {
    DB.mockClear()

    signer = new User('John', 'john@onf.dev', 'john')

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

  it('should save a individualAgreement to the database', () => {
    individualAgreement.save()
    expect(DB.connection).toHaveBeenCalledTimes(1)
    expect(mockCollection).toBeCalledWith('agreements')
    expect(mockAdd).toBeCalledWith({
      body: 'TODO, add agreement body',
      signer: individualAgreement.signer.data(),
      type: individualAgreement.type,
      dateSigned: individualAgreement.dateSigned
    })
  })

  it('should get a list of models from the DB', (done) => {
    const email = 'info@onf.org'
    Agreement.subscribe(
      email,
      res => {
        expect(mockWhere).toBeCalledWith('signer.email', '==', email)
        expect(res).toEqual([])
        done()
      },
      err => {
        done(err)
      }
    )
  })
})
