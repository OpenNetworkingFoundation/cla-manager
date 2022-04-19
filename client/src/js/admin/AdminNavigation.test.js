import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import AdminNav from './AdminNavigation'
import { Router } from 'react-router-dom'
import { Menu, MenuItem, Button } from '@material-ui/core'

Enzyme.configure({ adapter: new Adapter() })

describe('AdminNav Component Test Suite', () => {
  let wrapper
  const historyMock = { push: jest.fn(), location: {}, listen: jest.fn() }
  beforeEach(() => {
    historyMock.push.mockClear()
    wrapper = mount(<Router history={historyMock}><AdminNav/></Router>)
  })

  it('renders without crashing', () => {
    expect(wrapper).toBeDefined()
  })

  it('renders one button and one menu with two items', () => {
    expect(wrapper.find(Button)).toHaveLength(1)
    expect(wrapper.find(Menu)).toHaveLength(1)
    expect(wrapper.find(MenuItem)).toHaveLength(3)
  })

  describe('when clicking on a menu item', () => {
    it('should send me to the agreement list', () => {
      wrapper.find(MenuItem).first().simulate('click')
      expect(historyMock.push).toBeCalledWith('/admin/agreements')
    })
    it('should send me to the identities list', () => {
      wrapper.find(MenuItem).at(1).simulate('click')
      expect(historyMock.push).toBeCalledWith('/admin/identities')
    })
  })
})
