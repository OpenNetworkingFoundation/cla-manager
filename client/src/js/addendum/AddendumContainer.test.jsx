import React from 'react'
import Enzyme, { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import Adapter from 'enzyme-adapter-react-16'
import { Grid } from '@material-ui/core'
import AddendumContainer from './AddendumContainer'
import { Identity, IdentityType } from '../../common/model/identity'
import { Agreement, AgreementType } from '../../common/model/agreement'
import { Router } from 'react-router-dom'
import IdentityCard from './IdentityCard'
import { Addendum, AddendumType } from '../../common/model/addendum'

Enzyme.configure({ adapter: new Adapter() })

const identites = [
  new Identity(IdentityType.EMAIL, 'Foo', 'foo@opennetworking.org'),
  new Identity(IdentityType.GITHUB, 'Bar', 'bar')
]

const signer = new Identity(
  IdentityType.EMAIL,
  'ONF',
  'cla@opennetworking.org'
)

const addendums = [
  new Addendum(AddendumType.CONTRIBUTOR, 'test_id', signer, [identites[0]], []),
  new Addendum(AddendumType.CONTRIBUTOR, 'test_id', signer, [identites[1]], [])
]

describe('AddendumContainer Component Test Suite', () => {
  jest.useFakeTimers()

  let wrapper

  let user, agreement

  const historyMock = {
    push: jest.fn(),
    location: {},
    listen: jest.fn(),
    createHref: jest.fn()
  }

  let getAddendumsMock, getWhitelistMock

  beforeEach(async () => {

    user = {
      email: 'cla@opennetworking.org'
    }

    agreement = new Agreement(
      AgreementType.INDIVIDUAL, 'Lorem Ipsum', signer
    )

    getAddendumsMock = jest.spyOn(agreement, 'getAddendums').mockImplementation(() => {
      return Promise.resolve(addendums)
    })

    getWhitelistMock = jest.spyOn(agreement, 'getWhitelist').mockImplementation((id) => {
      return Promise.resolve(identites)
    })

    wrapper = mount(
      <Router history={historyMock}>
        <AddendumContainer user={user} agreement={agreement}/>
      </Router>
    )
    await act(async () => {
      jest.runAllTimers()
    })
  })

  it('should render the correct active identities', () => {
    wrapper.update()

    const summary = wrapper.find('.AddendumContainer__summary > p')
    expect(summary.text()).toContain('We have 2 addendums on file for this agreement.')

    const activeIdentities = wrapper.find(IdentityCard)
    expect(activeIdentities.length).toEqual(2)
  })

  describe('when I am the owner of the agreement', () => {
    it('should render the update form', () => {
      wrapper.update()
      const updateForm = wrapper.find('.AddendumContainer__update-form')
      expect(updateForm).toHaveLength(1)
    })
  })

  describe('when I am an admin and watching someone else agreement', () => {

    // render the component again by changing the user email address
    // so that it does not match the signer
    beforeEach(async () => {
      user = {
        email: 'admin@opennetworking.org'
      }
      wrapper = mount(
        <Router history={historyMock}>
          <AddendumContainer user={user} agreement={agreement}/>
        </Router>
      )
      await act(async () => {
        jest.runAllTimers()
      })
    })
    it('should not render the update form', () => {
      wrapper.update()
      const updateForm = wrapper.find('.AddendumContainer__update-form')
      expect(updateForm).toHaveLength(0)
    })
  })
})
