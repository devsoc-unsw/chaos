/* eslint-disable react/jsx-props-no-spreading */

import { useEffect, useState } from "react";
import { Route, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { isLogin } from "../../utils";

const PrivateRoute = ({ component: Component, ...rest }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function getLoggedIn() {
      isLogin()
        .then((res) => {
          setLoggedIn(res);
        })
        .catch(() => {
          setLoggedIn(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    getLoggedIn();
  }, []);

  if (!loading) {
    return (
      <Route
        {...rest}
        render={(props) =>
          loggedIn ? <Component {...props} /> : <Navigate to="/" />
        }
      />
    );
  }
  return <div />;
};

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired,
};

export default PrivateRoute;
