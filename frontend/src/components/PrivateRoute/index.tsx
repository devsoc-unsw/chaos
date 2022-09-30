/* eslint-disable react/jsx-props-no-spreading */

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { Route, useNavigate } from "react-router-dom";
import { isLoggedIn } from "../../utils";

const PrivateRoute = (props: ComponentProps<typeof Route>) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    function getLoggedIn() {
      if (!isLoggedIn()) {
        navigate("/");
      }
      setLoading(false);
    }

    getLoggedIn();
  }, []);

  if (loading) {
    return <div />;
  }

  return <Route {...props} />;
};

export default PrivateRoute;
