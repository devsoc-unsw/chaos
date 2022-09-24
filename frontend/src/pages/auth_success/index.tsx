import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FetchError } from "api/api";
import type { AuthenticateErrResponse, AuthenticateResponse } from "types/api";
import { authenticate } from "../../api";
import { LoadingIndicator } from "../../components";
import useQuery from "../../hooks/useQuery";
import { SIGNUP_REQUIRED } from "../../utils/constants";
import { setStore } from "../../utils";

const AuthSuccess = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState({ message: "" });

  useEffect(() => {
    async function attemptAuth() {
      const code = query.get("code");
      console.log(code);
      if (code) {
        let data: AuthenticateResponse | AuthenticateErrResponse;
        try {
          data = await authenticate(code);
        } catch (err: any) {
          if (err instanceof FetchError) {
            data = await err.resp.json();
          } else {
            console.error(err);
            setError(err);
            setIsLoading(false);
            return;
          }
        }

        if (typeof data === "string") {
          // wtf do we do here
        } else if (SIGNUP_REQUIRED in data) {
          setNeedsSignup(true);
          setStore("name", data[SIGNUP_REQUIRED].name!);
          setStore("signup_token", data[SIGNUP_REQUIRED].signup_token);
        } else {
          localStorage.setItem("name", data.name);
          localStorage.setItem("AUTH_TOKEN", data.token);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      }
    }

    attemptAuth();
  }, []);

  useEffect(() => {
    if (needsSignup) {
      navigate("/signup");
    } else if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [needsSignup, isAuthenticated]);

  const renderIsAuthenticated = () =>
    isAuthenticated ? (
      <div>
        <h1>Redirecting you...</h1>
      </div>
    ) : (
      <div>
        <h1>Not Authenticated</h1>
        Error: {error.message}
      </div>
    );

  if (isLoading) {
    return (
      <>
        <div>Authenticating...</div>
        <LoadingIndicator />
      </>
    );
  }

  return renderIsAuthenticated();
};

export default AuthSuccess;
