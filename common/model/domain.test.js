import { Domain } from './domain'
import { FirestoreDate, FirestoreMock } from '../test_helpers/firestore.mock'
import DB from '../db/db'

const date = new FirestoreDate(new Date())
const enddate = new FirestoreDate(new Date())
const domain1 = { id: 'id_1', data: () => new Domain(null, 'one.com', true, date, null).toJson() }

describe('The Domain model', () => {
  const firestoreMock = new FirestoreMock()
  let model
  beforeEach(() => {
    const DBSpy = jest.spyOn(DB, 'connection').mockImplementation(() => firestoreMock)
    DBSpy.mockClear()
    firestoreMock.reset()
    model = new Domain(0, 'test.com', true, date.toDate(), null)
  })
  it('should correctly instantiate the class', () => {
    expect(model.id).toEqual(0)
    expect(model.name).toEqual('test.com')
    expect(model.valid).toEqual(true)
    expect(model.createdOn).toEqual(date.toDate())
    expect(model.deletedOn).toEqual(null)
  })

  describe('the listValidDomains method', () => {
    it('should return all the validated domains in the DB', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { id: 'id_1', data: () => new Domain(null, 'one.com', true, date, null).toJson() }
        ]
      }
      Domain.listValidDomains()
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollection).toBeCalledWith('domains')
          expect(firestoreMock.mockWhere).toBeCalledWith('valid', '==', true)
          expect(firestoreMock.mockOrderBy).toBeCalledWith('name')
          expect(res[0].id).toEqual('id_1')
          expect(res[0].name).toEqual('one.com')
          expect(res[0].valid).toEqual(true)
          expect(res[0].createdOn).toEqual(date.toDate().toLocaleString())
          expect(res[0].deletedOn).toEqual(null)
          done()
        })
        .catch(done)
    })
  })

  describe('the listInvalidDomains method', () => {
    it('should return all the invalidated domains in the DB', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { id: 'id_2', data: () => new Domain(null, 'two.com', false, date, enddate).toJson() }
        ]
      }
      Domain.listInvalidDomains()
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollection).toBeCalledWith('domains')
          expect(firestoreMock.mockWhere).toBeCalledWith('valid', '==', false)
          expect(firestoreMock.mockOrderBy).toBeCalledWith('name')
          expect(firestoreMock.mockOrderBy).toBeCalledWith('createdOn')
          expect(res[0].id).toEqual('id_2')
          expect(res[0].name).toEqual('two.com')
          expect(res[0].valid).toEqual(false)
          expect(res[0].createdOn).toEqual(date.toDate().toLocaleString())
          expect(res[0].deletedOn).toEqual(enddate.toDate().toLocaleString())
          done()
        })
        .catch(done)
    })
  })

  describe('the checkIfDomainExists method', () => {
    it('should whether or not the domain exists in the DB', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [
          { id: 'id_2', data: () => new Domain(null, 'two.com', false, date, null).toJson() }
        ]
      }
      Domain.checkIfDomainExists('test')
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollection).toBeCalledWith('domains')
          expect(firestoreMock.mockWhere).toBeCalledWith('valid', '==', true)
          expect(firestoreMock.mockWhere).toBeCalledWith('name', '==', 'test')
          expect(res).toEqual(true)
          done()
        })
        .catch(done)
    })
  })

  describe('the fromDocumentSnapshot method', () => {
    it('should return a Domain object from the snapshot', () => {
      const domain = Domain.fromDocumentSnapshot(domain1)
      expect(DB.connection).toHaveBeenCalledTimes(0)
      expect(domain.id).toEqual(domain1.id)
      expect(domain.name).toEqual(domain1.data().name)
      expect(domain.valid).toEqual(domain1.data().valid)
      expect(domain.createdOn).toEqual(domain1.data().createdOn.toDate().toLocaleString())
      expect(domain.deletedOn).toEqual(domain1.data().deletedOn)
    })
  })

  describe('the invalidate method', () => {
    it('should invalidate the domain in the DB', (done) => {
      Domain.invalidate(domain1.id)
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollection).toBeCalledWith('domains')
          expect(firestoreMock.mockUpdate).toBeCalledTimes(1)
          expect(firestoreMock.mockDoc).toBeCalledTimes(1)
          expect(firestoreMock.mockDoc).toBeCalledWith(domain1.id)
          done()
        })
        .catch(done)
    })
  })

  describe('the validate method', () => {
    it('should validate the domain in the DB', (done) => {
      firestoreMock.mockAddReturn = { id: 'id_1' }

      model.validate()
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollection).toBeCalledWith('domains')
          expect(firestoreMock.mockAdd).toBeCalledTimes(1)
          expect(res.id).toEqual('id_1')
          expect(res.name).toEqual('test.com')
          expect(res.valid).toEqual(true)
          expect(res.createdOn).toEqual(date.toDate().toLocaleString())
          expect(res.deletedOn).toEqual(null)
          done()
        })
        .catch(done)
    })
  })

  describe('the toJson method', () => {
    it('should convert the domain object to json', () => {
      const json = model.toJson()
      expect(DB.connection).toHaveBeenCalledTimes(0)
      expect(json.name).toEqual('test.com')
      expect(json.valid).toEqual(true)
      expect(json.createdOn).toEqual(date.toDate())
      expect(json.deletedOn).toEqual(null)
    })
  })
})
