import React, { useEffect } from "react";
import { authenticate } from "../../api";
import useQuery from "../../hooks/useQuery";

const AuthSuccess = () => {
  const query = useQuery();
  const [state, setState] = React.useState({
    isAuthenticated: false,
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
          .then(({ token }) => {
            localStorage.setItem("AUTH_TOKEN", token);
            setState({
              isAuthenticated: true,
              isAuthenticating: false,
              error: null,
            });
          })
          .catch((error) => {
            setState({
              isAuthenticated: false,
              isAuthenticating: false,
              error,
            });
          });
      }
    }

    attemptAuth();
  }, []);

  return state.isAuthenticating ? (
    <div>Authenticating...</div>
  ) : state.isAuthenticated ? (
    <div> success</div>
  ) : (
    <>
      <div>
        <h1>Authentication failed</h1>
        <p>{state.error.message}</p>
      </div>
    </>
  );
};

export default AuthSuccess;
