import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FetchError } from "api/api";

import { authenticate } from "../../api";
import { LoadingIndicator } from "../../components";
import useQuery from "../../hooks/useQuery";
import { setStore } from "../../utils";
import { SIGNUP_REQUIRED } from "../../utils/constants";

import type { AuthenticateErrResponse, AuthenticateResponse } from "types/api";

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
        } catch (err) {
          if (err instanceof FetchError) {
            data = (await err.resp.json()) as AuthenticateErrResponse;
          } else {
            console.error(err);
            if (err instanceof Error) {
              setError(err);
            }
            setError({ message: "An unknown error occurred" });
            setIsLoading(false);
            return;
          }
        }

        if (typeof data === "string") {
          // wtf do we do here
        } else if (SIGNUP_REQUIRED in data) {
          setNeedsSignup(true);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

    void attemptAuth();
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
