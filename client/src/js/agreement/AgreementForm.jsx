import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Paper, Grid, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ValidatorForm, TextValidator} from 'react-material-ui-form-validator';
import Button from '@material-ui/core/Button';
import AgreementDisplay from './AgreementDisplay'
import AddendumContainer from '../addendum/AddendumContainer'

const useStyles = makeStyles(theme => ({
	root: {
	  padding: theme.spacing(2)
	}
  }));

  /**
 * Component which displays an Agreement, both for creation and update.
 */
function AgreementForm(props) {

	const agreementId = props.agreementId;

	// TODO if props.agreementId is set, load an existing agreement

	const classes = useStyles();
	const [name, setName] = useState("");

	const handleSubmit = (evt) => {
		evt.preventDefault();
		console.log("Name used:", name)
		// TODO save model
		// TODO after save send to view/<agreementId>
	}

	// NOTE consider moving in a different component
	const form = (
	<ValidatorForm onSubmit={handleSubmit}>
		<Grid container spacing={2}>
			<Grid item xs={12} md={6}>
				<TextValidator
					fullWidth
					label="Full Name"
					name="name"
					value={name}
					onChange={e => setName(e.target.value)}
					validators={['required']}
					errorMessages={['You must enter your name']}
					variant="outlined"
				/>
			</Grid>
			<Grid item xs={12} md={6}>
				<Box textAlign="right" m={1}>
					<Button type="submit"
					variant="contained"
					color="primary"
					size="large"
					>Sign Agreement</Button>
				</Box>
			</Grid>
		</Grid>

	</ValidatorForm>);

	return (
		<Paper elevation={23} className={classes.root}>
			<Grid container spacing={2}>
				<Grid item xs={12}> 
					<h2>AgreementForm</h2>
					<AgreementDisplay></AgreementDisplay>
				</Grid>
			</Grid>
			{agreementId ? null:form}
			{agreementId ? <AddendumContainer user={props.user} agreementId={agreementId}></AddendumContainer>:null}
		</Paper>
	)
}

AgreementForm.propTypes = {
	user: PropTypes.object.isRequired,
	agreementId: PropTypes.string,
};

export default AgreementForm;