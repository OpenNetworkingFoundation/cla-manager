import React from 'react'
import Enzyme, { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import Adapter from 'enzyme-adapter-react-16'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom'
import AppRouter from './AppRouter'
import { Firebase } from '../common/app/app'
import AdminAgreementsList from './admin/AdminAgreementsList'
import PermissionDenied from './admin/PermissionDenied'
import { FirestoreMock } from '../common/test_helpers/firestore.mock'
import DB from '../common/db/db'
import AdminIdentitiesList from './admin/AdminIdentitiesList'
import AdminLinkedAccountList from './admin/AdminLinkedAccountsList'

Enzyme.configure({ adapter: new Adapter() })

const user = {
  currentUser: {
    email: 'foo@onf.org'
  }
}

const mountAppAt = (user, route, isAdmin) => {
  const history = createMemoryHistory({ initialEntries: [route] })
  return mount(
    <Router history={history}>
      <AppRouter user={user} isAdmin={isAdmin}/>
    </Router>
  )
}

describe('AppRouter Component Test Suite', () => {

  const firestoreMock = new FirestoreMock()
  let wrapper
  beforeEach(() => {
    const DBSpy = jest.spyOn(DB, 'connection').mockImplementation(() => firestoreMock)
    DBSpy.mockClear()
    firestoreMock.reset()
    jest.spyOn(Firebase, 'auth').mockImplementation(() => {
      return user
    })
  })

  describe('when the user is Admin', () => {
    const isAdmin = true

    beforeEach(() => {
      firestoreMock.mockGetReturn = {
        docs: []
      }
    })

    it('should render the AdminAgreementsList', function () {
      act(() => {
        wrapper = mountAppAt(user, '/admin/agreements', isAdmin)
      })
      expect(wrapper.find(AdminAgreementsList)).toHaveLength(1)
    })
    it('should render the AdminIdentitiesList', function () {
      act(() => {
        wrapper = mountAppAt(user, '/admin/identities', isAdmin)
      })
      expect(wrapper.find(AdminIdentitiesList)).toHaveLength(1)
    })
    it('should render the AdminLinkedAccountList', function () {
      act(() => {
        wrapper = mountAppAt(user, '/admin/linked-accounts', isAdmin)
      })
      expect(wrapper.find(AdminLinkedAccountList)).toHaveLength(1)
    })
  })

  describe('when the user is NOT Admin', () => {
    const isAdmin = false
    it('should render PermissionDenied', function () {
      act(() => {
        wrapper = mountAppAt(user, '/admin/agreements', isAdmin)
      })
      expect(wrapper.find(PermissionDenied)).toHaveLength(1)
    })
    it('should render PermissionDenied', function () {
      act(() => {
        wrapper = mountAppAt(user, '/admin/identities', isAdmin)
      })
      expect(wrapper.find(PermissionDenied)).toHaveLength(1)
    })
    it('should render PermissionDenied', function () {
      act(() => {
        wrapper = mountAppAt(user, '/admin/linked-accounts', isAdmin)
      })
      expect(wrapper.find(PermissionDenied)).toHaveLength(1)
    })
  })
})
