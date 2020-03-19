import React, { useState } from 'react'
import { Menu, MenuItem, Button } from '@material-ui/core'

function AdminNav (props) {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
      <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
        Admin
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}>
        <MenuItem onClick={handleClose}>Agreements</MenuItem>
        <MenuItem onClick={handleClose}>Identities</MenuItem>
      </Menu>
    </div>
  )
}

export default AdminNav

