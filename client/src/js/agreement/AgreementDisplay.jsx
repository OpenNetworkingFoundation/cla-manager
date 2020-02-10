import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { Card } from '@material-ui/core'
import { ClaText } from '../cla/ClaText'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    maxHeight: '600px',
    overflowY: 'scroll'
  },
  claContainer: {
    '& h3': {
      textAlign: 'center'
    },
    '& ul': {
      listStyleType: 'none',
      textIndent: '-1em',
      '& li': {
        marginBottom: theme.spacing(2)
      }
    }
  }
}))

function AgreementDisplay (props) {
  const classes = useStyles()
  return (
    <Card variant='outlined' className={classes.root}>
      {
        props.text ?
          <div className={classes.claContainer} dangerouslySetInnerHTML={{ __html: props.text }}/>
          :
          <div className={classes.claContainer} dangerouslySetInnerHTML={{ __html: ClaText }}/>
      }
    </Card>
  )
}

AgreementDisplay.propTypes = {
  text: PropTypes.string
}

export default AgreementDisplay
