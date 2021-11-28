/* eslint-disable react/jsx-props-no-spreading */

import React, { useEffect, useState } from "react";
import { Route, Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import { isLogin } from "../../utils";

const PrivateRoute = function ({ component: Component, ...rest }) {
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
          loggedIn ? <Component {...props} /> : <Redirect to="/" />
        }
      />
    );
  }
  return <div />;
};

PrivateRoute.defaultProps = {
  scopeRequired: "applicant",
};

PrivateRoute.propTypes = {
  scopeRequired: PropTypes.string,
  component: PropTypes.func.isRequired,
};

export default PrivateRoute;
