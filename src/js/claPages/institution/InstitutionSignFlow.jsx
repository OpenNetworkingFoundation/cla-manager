import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Paper from '@material-ui/core/Paper';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import InstitutionInfoForm from './InstitutionInfoForm';
import ContributorEmailForm from './ContributorEmailForm';

const useStyles = makeStyles(theme => ({
  appBar: {
    position: 'relative',
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
  stepper: {
    padding: theme.spacing(3, 0, 5),
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1),
  },
}));

const steps = ['Contributor emails', 'Institution Info', 'Review'];

function getStepContent(step, institutionInfo) {
  switch (step) {
    case 0:
      return <ContributorEmailForm formInfo={institutionInfo[step]} />;
    case 1:
      return <InstitutionInfoForm formInfo={institutionInfo[step]} />;
    case 2:
      return <div />;
    default:
      throw new Error('Unknown step');
  }
}

function extractFormInfo(mainDOMNode) {
  let formInfo = {};
  [...mainDOMNode.querySelectorAll('input')].forEach(input => {
    const name = input.name;
    const value = input.value;

    formInfo[name] = value;
  });
  return formInfo;
}

export default function InstitutionSignFlow() {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [institutionInfo, setInstitutionInfo] = React.useState([{}, {}, {}]);

  const handleNext = () => {
    const mainDOMNode = document.querySelector('main');
    let newInstitutionInfo = [...institutionInfo];
    newInstitutionInfo[activeStep] = extractFormInfo(mainDOMNode);
    setInstitutionInfo(newInstitutionInfo);
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    const mainDOMNode = document.querySelector('main');
    let newInstitutionInfo = [...institutionInfo];
    newInstitutionInfo[activeStep] = extractFormInfo(mainDOMNode);
    setInstitutionInfo(newInstitutionInfo);
    setActiveStep(activeStep - 1);
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar position="absolute" color="default" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap>
            Company name
          </Typography>
        </Toolbar>
      </AppBar>
      <main className={classes.layout}>
        <Paper className={classes.paper}>
          <Typography component="h1" variant="h4" align="center">
            Checkout
          </Typography>
          <Stepper activeStep={activeStep} className={classes.stepper}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <React.Fragment>
            {activeStep === steps.length ? (
              <React.Fragment>
                <Typography variant="h5" gutterBottom>
                  Thank you for signing
                </Typography>
                <Typography variant="subtitle1">
                  Subtitle
                </Typography>
              </React.Fragment>
            ) : (
              <React.Fragment>
                {getStepContent(activeStep, institutionInfo)}
                <div className={classes.buttons}>
                  {activeStep !== 0 && (
                    <Button onClick={handleBack} className={classes.button}>
                      Back
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    className={classes.button}
                  >
                    {activeStep === steps.length - 1 ? 'Confirm' : 'Next'}
                  </Button>
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        </Paper>
      </main>
    </React.Fragment>
  );
}

