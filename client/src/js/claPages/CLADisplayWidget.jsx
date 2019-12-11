import React from 'react';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import IndividualCLA from './IndividualCLA';
import InstitutionCLAForm from './institution/InstitutionCLAForm';
import PropTypes from 'prop-types';

const useStyles = makeStyles(theme => ({
    paper: {
        margin: theme.spacing(1),
        padding: theme.spacing(1) 
    }
}));

/**
 * Layout component for displaying a CLA plus an input form to sign the CLA.
 * TODO would be nice to make this an expansion panel: https://material-ui.com/demos/expansion-panels/
 */
function CLADisplayWidget(props) {
    const classes = useStyles();
    let cla;
    if (props.type === 'individual') {
        cla = <IndividualCLA user={props.user} />;
    }
    else if (props.type === 'institution') {
        cla = <InstitutionCLAForm user={props.user} /*onSubmit={props.onSubmit}*//>;
    }

    return (
        <div id="cla-widget">
            <Paper className={classes.paper}>
                {cla}
            </Paper>
        </div>
    );
}

CLADisplayWidget.propTypes = {
  type: PropTypes.string.isRequired,
  user: PropTypes.object,
  onSubmit: PropTypes.func//.isRequired
};

export default CLADisplayWidget;
