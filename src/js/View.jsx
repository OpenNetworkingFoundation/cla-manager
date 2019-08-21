import React from 'react';
import CLADisplayWidget from './CLADisplayWidget';

/**
 * Top-level controller for the page to sign a CLA. 
 */
class ViewPage extends React.Component {
    render() {
        const id = this.props.match.params.id;
        const user = this.props.user;
        return (
            <React.Fragment>
                {console.log(this.props)}
                CLA: {id}
            </React.Fragment>
        );
    }
}

export default ViewPage;
