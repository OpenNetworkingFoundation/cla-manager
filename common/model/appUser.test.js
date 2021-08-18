import DB from '../db/db'
import { AppUser } from './appUser.js'
import FirestoreMock from '../test_helpers/firestore.mock'
import { Firebase } from '../app/app'

const toUnixTimestap = (date) => {
  return new Date(date).getTime() / 1000
}

const account1 = {
  id: '123',
  data: () => {
    return {
      active: true,
      username: 'user1',
      email: null,
      hostname: 'github.com',
      key: 123,
      name: 'User1',
      updatedOn: { seconds: toUnixTimestap('2020/03/03') }
    }
  }
}

const account2 = {
  id: '456',
  data: () => {
    return {
      active: true,
      username: 'user2',
      email: 'user2@opennetworking.org',
      hostname: 'opennetworking.org',
      key: '2222:test',
      name: 'User2',
      updatedOn: { seconds: toUnixTimestap('2020/03/04') }
    }
  }
}

const account3 = {
  id: '789',
  data: () => {
    return {
      active: true,
      username: 'user3',
      email: 'user3@opennetworking.org',
      hostname: 'opennetworking.org',
      key: '3333:test',
      name: 'User3',
      updatedOn: { seconds: toUnixTimestap('2020/03/05') }
    }
  }
}

describe('The AppUser model', () => {
  let user
  const firestoreMock = new FirestoreMock()

  beforeEach(() => {
    const DBSpy = jest.spyOn(DB, 'connection').mockImplementation(() => firestoreMock)
    const authSpy = jest.spyOn(Firebase, 'auth').mockImplementation(() => {
      return { currentUser: { uid: 'uid' } }
    })
    DBSpy.mockClear()
    authSpy.mockClear()
    firestoreMock.reset()
    user = new AppUser('UID')
  })

  it('should correctly instantiate the class for user', () => {
    expect(user.uid).toEqual('UID')
  })

  describe('the listAllAccounts method', () => {
    it('should list all account of the user in database', (done) => {
      firestoreMock.mockGetReturn = {
        docs: [account1, account2, account3]
      }
      AppUser.listAllAccounts()
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollectionGroup).toBeCalledWith('accounts')

          expect(res[0].username).toEqual(account1.data().username)
          expect(res[0].active).toEqual(account1.data().active)
          expect(res[0].email).toEqual(account1.data().email)
          expect(res[0].hostname).toEqual(account1.data().hostname)
          expect(res[0].key).toEqual(account1.data().key)
          expect(res[0].name).toEqual(account1.data().name)
          expect(res[0].updatedOn).toEqual(account1.data().updatedOn)

          expect(res[1].username).toEqual(account2.data().username)
          expect(res[1].active).toEqual(account2.data().active)
          expect(res[1].email).toEqual(account2.data().email)
          expect(res[1].hostname).toEqual(account2.data().hostname)
          expect(res[1].key).toEqual(account2.data().key)
          expect(res[1].name).toEqual(account2.data().name)
          expect(res[1].updatedOn).toEqual(account2.data().updatedOn)

          expect(res[2].username).toEqual(account3.data().username)
          expect(res[2].active).toEqual(account3.data().active)
          expect(res[2].email).toEqual(account3.data().email)
          expect(res[2].hostname).toEqual(account3.data().hostname)
          expect(res[2].key).toEqual(account3.data().key)
          expect(res[2].name).toEqual(account3.data().name)
          expect(res[2].updatedOn).toEqual(account3.data().updatedOn)

          done()
        })
        .catch(done)
    })
  })

  describe('the deleteAccount method', () => {
    it('should delete the account of the user in database', (done) => {
      user.deleteAccount(account1.id)
        .then(res => {
          expect(DB.connection).toHaveBeenCalledTimes(1)
          expect(firestoreMock.mockCollection).toBeCalledWith('accounts')
          expect(firestoreMock.mockCollection).toBeCalledWith('appUsers')
          expect(firestoreMock.mockDoc).toBeCalledTimes(2)
          expect(firestoreMock.mockDoc).toBeCalledWith(user.uid)
          expect(firestoreMock.mockDoc).toBeCalledWith(account1.id)
          expect(firestoreMock.mockDelete).toBeCalledTimes(1)
          done()
        })
        .catch(done)
    })
  })

  describe('the accountFromSnapshot method', () => {
    it('should return a the data from the snapshot', () => {
      const res = AppUser.accountFromSnapshot(account1)
      expect(DB.connection).toHaveBeenCalledTimes(0)
      expect(res.id).toEqual(account1.id)
      expect(res.username).toEqual(account1.data().username)
      expect(res.active).toEqual(account1.data().active)
      expect(res.email).toEqual(account1.data().email)
      expect(res.hostname).toEqual(account1.data().hostname)
      expect(res.key).toEqual(account1.data().key)
      expect(res.name).toEqual(account1.data().name)
      expect(res.updatedOn).toEqual(account1.data().updatedOn)
    })
  })

  describe('the current method', () => {
    it('should return the current user object', () => {
      const user = AppUser.current()
      expect(user.uid).toEqual('uid')
    })
  })

  describe('the subscribeAccounts method', () => {
    it('should return the current user object', (done) => {
      firestoreMock.mockOnSnaptshotSuccess = {
        docs: [account1]
      }
      user.subscribeAccounts((res) => {
        expect(DB.connection).toHaveBeenCalledTimes(1)
        expect(firestoreMock.mockCollection).toBeCalledWith('accounts')
        expect(firestoreMock.mockCollection).toBeCalledWith('appUsers')
        expect(firestoreMock.mockOnSnaptshot).toHaveBeenCalledTimes(1)
        expect(res.length).toEqual(1)
        done()
      }, console.error)
    })
  })
})
