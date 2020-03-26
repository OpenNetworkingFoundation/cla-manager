import React, { useState } from 'react'
import { Menu, MenuItem, Button } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import MenuIcon from '@material-ui/icons/Menu'

function AdminNav (props) {
  const history = useHistory()
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (url) => {
    return () => {
      history.push(`/admin/${url}`)
      setAnchorEl(null)
    }
  }

  return (
    <div>
      <Button
        variant='outlined'
        startIcon={<MenuIcon />}
        onClick={handleClick}>
        Admin
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}>
        <MenuItem onClick={handleClose('agreements')}>Agreements</MenuItem>
        <MenuItem onClick={handleClose('identities')}>Identities</MenuItem>
      </Menu>
    </div>
  )
}

export default AdminNav
