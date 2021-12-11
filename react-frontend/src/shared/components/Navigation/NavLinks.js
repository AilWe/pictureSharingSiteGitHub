import React, {useContext } from "react";
import {NavLink} from "react-router-dom";
import {AuthContext} from "../../context/auth-context";
import "./NavLinks.css"
import Button from "../FormElements/Button";

const NavLinks = (props) => {
    const auth = useContext(AuthContext);

    return (
        <ul className="nav-links">
            <li>
                <NavLink to="/" exact={true}>All Users</NavLink>
            </li>
            {auth.isLoggedIn && (
                <li>
                    <NavLink to={`/${auth.userId}/places`}>My Places</NavLink>
                </li>
            )}
            {auth.isLoggedIn && (
                <li>
                    <NavLink to="/places/new">New Places</NavLink>
                </li>
            )}
            {!auth.isLoggedIn && (
                <li>
                    <NavLink to="/auth">Login</NavLink>
                </li>
            )}
            {auth.isLoggedIn && (
                <li>
                    <Button onClick={auth.logout}>Logout</Button>
                </li>
            )}
        </ul>
    );
}

export default NavLinks
