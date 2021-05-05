import DB from '../db/db'
import FirestoreMock from '../test_helpers/firestore.mock'

import { Whitelist } from './whitelists'

const toUnixTimestap = (date) => {
  return new Date(date).getTime() / 1000
}

const toDate = (timestamp) => {
  return new Date(timestamp * 1000)
}

const wl1 = {
  id: '123',
  data: () => {
    return {
      lastUpdated: { seconds: toUnixTimestap('2020/03/05') },
      values: ['email:wl1@opennetworking.org', 'email:foo@opennetworking.org', 'github:baz']
    }
  }
}
const wl2 = {
  id: '456',
  data: () => {
    return {
      lastUpdated: { seconds: toUnixTimestap('2020/03/03') },
      values: ['email:wl2@opennetworking.org', 'email:foo@opennetworking.org']
    }
  }
}
const wl3 = {
  id: '789',
  data: () => {
    return {
      lastUpdated: { seconds: toUnixTimestap('2020/03/02') },
      values: ['email:wl3@opennetworking.org']
    }
  }
}

describe('The Whitelist model', () => {
  const firestoreMock = new FirestoreMock()
  beforeEach(() => {
    const DBSpy = jest.spyOn(DB, 'connection').mockImplementation(() => firestoreMock)
    DBSpy.mockClear()
    firestoreMock.reset()
  })
  it('should list all the entries in the DB', (done) => {
    firestoreMock.mockGetReturn = {
      docs: [wl1, wl2, wl3]
    }
    Whitelist.list()
      .then(res => {
        expect(res[0].id).toEqual(wl1.id)
        expect(res[0].values).toEqual(wl1.data().values)
        expect(res[0].lastUpdated).toEqual(toDate(wl1.data().lastUpdated.seconds))

        expect(res[1].id).toEqual(wl2.id)
        expect(res[1].values).toEqual(wl2.data().values)
        expect(res[1].lastUpdated).toEqual(toDate(wl2.data().lastUpdated.seconds))

        expect(res[2].id).toEqual(wl3.id)
        expect(res[2].values).toEqual(wl3.data().values)
        expect(res[2].lastUpdated).toEqual(toDate(wl3.data().lastUpdated.seconds))
        done()
      })
      .catch(done)
  })

  it('should get a single whitelist', (done) => {
    const id = '123'
    Whitelist.get(id)
      .then(res => {
        expect(firestoreMock.mockDoc).toBeCalledWith(id)
        expect(firestoreMock.mockGet).toBeCalled()
        done()
      })
      .catch(done)
  })

  it('should return a list of identities with the associated agreements', (done) => {
    firestoreMock.mockGetReturn = {
      docs: [wl1, wl2, wl3]
    }
    Whitelist.getWhitelistWithAgreementId()
      .then(res => {
        expect(firestoreMock.mockWhere).not.toBeCalled()
        expect(res[0].identity).toEqual('wl1@opennetworking.org')
        expect(res[0].type).toEqual('email')
        expect(res[0].agreements).toEqual(['123'])

        expect(res[1].identity).toEqual('foo@opennetworking.org')
        expect(res[1].type).toEqual('email')
        expect(res[1].agreements).toEqual(['123', '456'])

        expect(res[2].identity).toEqual('baz')
        expect(res[2].type).toEqual('github')
        expect(res[2].agreements).toEqual(['123'])

        expect(res[3].identity).toEqual('wl2@opennetworking.org')
        expect(res[3].type).toEqual('email')
        expect(res[3].agreements).toEqual(['456'])

        expect(res[4].identity).toEqual('wl3@opennetworking.org')
        expect(res[4].type).toEqual('email')
        expect(res[4].agreements).toEqual(['789'])

        done()
      })
      .catch(done)
  })

  it('should get all the Whitelists IDs for which an email address is listed as a manager', (done) => {
    firestoreMock.mockGetReturn = {
      docs: [wl1, wl2, wl3]
    }
    const email = 'test@onf.org'
    Whitelist.getByManager(email)
      .then(res => {
        expect(firestoreMock.mockWhere).toBeCalledWith('managers', 'array-contains', email)
        expect(res).toEqual([wl1.id, wl2.id, wl3.id])
        done()
      })
      .catch(done)
  })
})
