import React from 'react';
import Card from '@material-ui/core/Card';
import CLADisplayWidget from './CLADisplayWidget';

const firebase = window.firebase;

/**
 * Top-level controller for the page to sign a CLA. 
 */
class SignPage extends React.Component {
    render() {
        const type = this.props.match.params.type || 'individual';
        const user = this.props.user;
        return (
            <div>
            <main class="mdl-layout__content mdl-color--grey-100">
            <div class="page-content mdl-grid">

            <Card> 
                <div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">
                <h2 class="mdl-card__title-text">Contributor License Agreement</h2>
                </div>
                {console.log(this.props)}
                <CLADisplayWidget
                type={type}
                user={user}
                onSubmit={this.handleCLASignature}
                />
            </Card>
            </div>
        </main>
        </div>
        );
    }
}

export default SignPage;
