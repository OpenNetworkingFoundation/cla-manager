import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';

const useStyles = makeStyles({
	card: {
	  background: red[300],
	  padding: 30,
	  marginTop: 100,
	},
	pos: {
	  marginTop: 12,
	},
  });
export default function DevError() {
	const classes = useStyles();
	return (
        <Container component="main" maxWidth="xs">
			<Card className={classes.card}>
				<CardContent>
					<Typography variant="h5" component="h2">
						Developer error
					</Typography>
					<Typography className={classes.pos} color="textSecondary">
					REACT_APP_FIREBASE_ENV and/or REACT_APP_FIREBASE_API_KEY are missing
					</Typography>
				</CardContent>
			</Card>
		</Container>
	)
}

export async function HandleDevError(fn) {
	fn(<DevError />)
}
