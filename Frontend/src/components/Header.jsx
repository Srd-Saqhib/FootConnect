import React, { useState } from 'react';
import "../styles/header.css";
import Login from './Login';

function Header(props) {

    return (<div className="headstyle">
        <h1>FootConnect</h1>
        <div className="btn-group">
            {!props.isLoggedIn && <button className='btn-head1' disabled={props.Sdisable} onClick={props.onLogin}>Login</button>}
            {!props.isLoggedIn && <button className='btn-head2' disabled={props.Rdisable} onClick={props.onRegister}>Register</button>}
        </div>
    </div>);
}

export default Header;