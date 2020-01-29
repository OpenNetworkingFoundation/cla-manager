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
  let model
  let signer = null

  beforeEach(() => {
    DB.mockClear()

    signer = new User('John', 'john@onf.dev', 'john')

    model = new Agreement(
      AgreementType.INDIVIDUAL,
      'TODO, add agreement body',
      signer
    )
  })
  it('should correctly instantiate the class for INDIVIDUAL', () => {
    expect(model.id).toEqual(null)
    expect(model.type).toEqual(AgreementType.INDIVIDUAL)
    expect(model.signer.email).toEqual(signer.email)
    expect(model.signer.name).toEqual(signer.name)
    expect(model.organization).toEqual(null)
  })

  it('should save a model to the database', () => {
    model.save()
    expect(DB.connection).toHaveBeenCalledTimes(1)
    expect(mockCollection).toBeCalledWith('agreements')
    expect(mockAdd).toBeCalledWith({
      signer: model.signer,
      type: model.type,
      dateSigned: model.dateSigned
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
