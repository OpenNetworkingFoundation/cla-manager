import React from 'react';
import Card from '@material-ui/core/Card';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types';
import InstitutionSignFlow from './InstitutionSignFlow';
import Confirm from './Confirm';
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
import ReviewForm from './ReviewForm';
import InstitutionInfoForm from './InstitutionInfoForm';
import ContributorEmailForm from './ContributorEmailForm';

import { ValidatorForm } from 'react-material-ui-form-validator';


const steps = ['Review Agreement', 'Schedule A: Contributors', 'Institution Info', 'Review'];

/**
 * Form for signing a CLA on behalf of an institution.
 */
class InstitutionCLAForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            activeStep: 0,
            institutionInfo: [{}, {}, {}]
        }
    }

    // handleBack() {
    //     const mainDOMNode = document.querySelector('div#cla-widget');
    //     let newInstitutionInfo = [...institutionInfo];
    //     newInstitutionInfo[activeStep] = extractFormInfo(mainDOMNode);
    //     setInstitutionInfo(newInstitutionInfo);
    //     this.setState({activeStep: this.state.activeStep - 1})
    //     setActiveStep(activeStep - 1);
    //   };

    getStepContent(x, y) {
      let step = this.state.activeStep;
      switch (step) {
        case 0:
          return <ReviewForm />;
        case 1:
          return <ContributorEmailForm
                    formInfo={this.state.institutionInfo[step]} 
                    handleChange={this.handleChange(step)}  
                    />;
        case 2:
          return <InstitutionInfoForm
                    formInfo={this.state.institutionInfo[step]}
                    handleChange={this.handleChange(step)}  
                    />;
        case 3:
          return <div />;
        default:
          throw new Error('Unknown step');
      }
    }
    
    // extractFormInfo(mainDOMNode) {
    //   let formInfo = {};
    //   [...mainDOMNode.querySelectorAll('input')].forEach(input => {
    //     const name = input.name;
    //     const value = input.value;
    
    //     formInfo[name] = value;
    //   });
    //   return formInfo;
    // }

    handleChange = (step) => (event) => {
        console.log(step, event.target.name, event.target.value);
        // this.setState({ name });
        let newInstitutionInfo = [...this.state.institutionInfo];
        newInstitutionInfo[step][event.target.name] = event.target.value;
        this.setState(newInstitutionInfo);
    }

    handleSubmit() {
        console.log("submit");
    }
    

    render() {
        // let userEmail;
        // if (this.props.user) {
        //     userEmail = this.props.user.email;
        // }
        const activeStep = this.state.activeStep;
        let stepFn = (delta) => () => this.setState({
            activeStep: this.state.activeStep + delta
        });
        return (
            <Paper /*className={classes.paper}*/>
                <Typography component="h1" variant="h4" align="center">
                    CLA
                </Typography>
                <Stepper activeStep={activeStep} /*className={classes.stepper}*/>
                    {steps.map(label => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <React.Fragment>
                    {activeStep === steps.length ? ( <Confirm />) : (
                        <ValidatorForm  
                            ref="form"
                            onSubmit={this.handleSubmit}
                            onError={errors => console.log(errors)}
                        >
                            {this.getStepContent()}
                            <div /*className={classes.buttons}*/>
                                {activeStep !== 0 && (
                                    <Button onClick={stepFn(-1)} /*className={classes.button}*/>
                                        Back
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={stepFn(1)}
                                    // className={classes.button}
                                >
                                    {activeStep === steps.length - 1 ? 'I AGREE' : 'Next'}
                                </Button>
                            </div>
                        </ValidatorForm>
                        )}
                </React.Fragment>
            </Paper>
        );
    }
}

InstitutionCLAForm.propTypes = {
    user: PropTypes.object,
    // onSubmit: PropTypes.func.isRequired
};

export default InstitutionCLAForm;
