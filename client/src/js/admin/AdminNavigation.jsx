import React, { useState } from 'react'
import { Menu, MenuItem, Button } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import MenuIcon from '@material-ui/icons/Menu'
import { makeStyles } from '@material-ui/core/styles'


const useStyles = makeStyles(theme => ({
  link: {
    color: theme.palette.common.white,
    borderColor: theme.palette.common.white,
  }
}))

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
  const classes = useStyles()

  return (
    <div>
      <Button
        className={classes.link}
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
        <MenuItem onClick={handleClose('linked-accounts')}>Linked Accounts</MenuItem>
        <MenuItem onClick={handleClose('manage-domains')}>Manage Domains</MenuItem>
      </Menu>
    </div>
  )
}

export default AdminNav
