import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        let data;
        try {
          const res = await authenticate(code);
          data = await res.json();
        } catch (err) {
          console.error(err);
          setError(err);
          setIsLoading(false);
          return;
        }

        if (data[SIGNUP_REQUIRED]) {
          setNeedsSignup(true);
          setIsLoading(false);
          setStore("name", data[SIGNUP_REQUIRED].name);
          setStore("signup_token", data[SIGNUP_REQUIRED].signup_token);
        } else {
          localStorage.setItem("name", data.name);
          localStorage.setItem("AUTH_TOKEN", data.token);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
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
