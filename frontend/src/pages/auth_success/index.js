import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticate } from "../../api";
import { LoadingIndicator } from "../../components";
import useQuery from "../../hooks/useQuery";
import { SIGNUP_REQUIRED } from "../../utils/consts";
import { setStore } from "../../utils";

const AuthSuccess = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    isAuthenticated: false,
    needsSignup: false,
    isAuthenticating: true,
    error: null,
  });

  useEffect(() => {
    async function attemptAuth() {
      const code = query.get("code");
      console.log(code);
      if (code) {
        await authenticate(code)
          .then((res) => res.json())
          .then((data) => {
            if (data[SIGNUP_REQUIRED]) {
              setState({
                isAuthenticated: true,
                isAuthenticating: false,
                needsSignup: true,
                error: null,
              });
              setStore("name", data[SIGNUP_REQUIRED].name);
              setStore("signup_token", data[SIGNUP_REQUIRED].signup_token);
            } else {
              localStorage.setItem("AUTH_TOKEN", data.token);
              setState({
                isAuthenticated: true,
                isAuthenticating: false,
                needsSignup: false,
                error: null,
              });
            }
          })
          .catch((error) => {
            setState({
              isAuthenticated: false,
              isAuthenticating: false,
              needsSignup: false,
              error,
            });
          });
      }
    }

    attemptAuth();
  }, []);

  if (state.needsSignup) {
    navigate("/signup");
  } else if (state.isAuthenticated) {
    navigate("/dashboard");
  }

  const renderIsAuthenticated = () =>
    state.isAuthenticated ? (
      <div>
        <h1>Redirecting you...</h1>
      </div>
    ) : (
      <div>
        <h1>Not Authenticated</h1>
        {state.error.message}
      </div>
    );

  return state.isAuthenticating ? (
    <>
      <div>Authenticating...</div>
      <LoadingIndicator />
    </>
  ) : (
    renderIsAuthenticated()
  );
};

export default AuthSuccess;
