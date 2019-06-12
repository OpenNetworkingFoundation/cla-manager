import React from 'react';
import ReactDOM from 'react-dom';
import SignPage from './js/SignPage';
import * as serviceWorker from './serviceWorker';

// todo: add auth
const type = new URL(window.location.href).searchParams.get('type') || 'individual';

ReactDOM.render(<SignPage type={type} />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
