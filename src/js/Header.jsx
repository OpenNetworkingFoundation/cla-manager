import React from 'react';
import PropTypes from 'prop-types';
import SignOutContainer from './SignOutContainer';

/**
 * Renders the standard header for pages within the CLA Manager application.
 */
class Header extends React.Component {
  render() {
    const { user } = this.props;

    let signOutContainer;

    // Only show a sign-out container if there is a currently logged in user.
    if (user) {
      signOutContainer = (
        <SignOutContainer
          user={this.props.user}
          onSignOut={this.props.onSignOut}
        />
      );
    }

    return (
      <header className="mdl-layout__header">
        <div className="mdl-layout__header-row">
          <span className="mdl-layout-title">CLA Manager</span>
          <div className="mdl-layout-spacer"></div>
          {signOutContainer}
        </div>
      </header>
    );
  }
}

Header.propTypes = {
  user: PropTypes.object
};

export default Header;
