import React from 'react';

/**
 * Top-level controller for the page to sign a CLA. 
 */
class ViewPage extends React.Component {
    render() {
        const id = this.props.match.params.id;
        return (
            <React.Fragment>
                {console.log(this.props)}
                CLA: {id}
            </React.Fragment>
        );
    }
}

export default ViewPage;
