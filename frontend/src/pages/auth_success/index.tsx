import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FetchError } from "api/api";

import { getSelfInfo } from "../../api";
import { LoadingIndicator } from "../../components";
import useQuery from "../../hooks/useQuery";
import { pushToast } from "../../utils";

const AuthSuccess = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState({ message: "" });

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("Checking authentication status...");
        const user = await getSelfInfo();
        console.log("Authentication successful:", user);
        localStorage.setItem("name", user.name);
        setIsAuthenticated(true);
        } catch (err) {
        console.error("Authentication error:", err);
          if (err instanceof FetchError) {
          const errorMessage = err.message || "Unknown error";
          console.error("Fetch error details:", errorMessage);
          setError({ message: `Authentication failed: ${errorMessage}` });
        } else {
          console.error("Unknown error:", err);
          setError({ message: "An unknown error occurred during authentication" });
        }
      } finally {
        setIsLoading(false);
      }
    }

    void checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      pushToast("Authenticated", "Logged in successfully", "success");
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div tw="flex flex-col items-center justify-center gap-4">
        <div>Authenticating...</div>
        <LoadingIndicator />
      </div>
    );
  }

  if (error.message) {
    return (
      <div tw="flex flex-col items-center justify-center gap-4">
        <h1 tw="text-xl font-semibold text-red-600">Authentication Failed</h1>
        <p tw="text-gray-600">{error.message}</p>
        <button
          tw="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          onClick={() => navigate("/")}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div tw="flex flex-col items-center justify-center gap-4">
      <h1>Redirecting you...</h1>
      <LoadingIndicator />
    </div>
  );
};

export default AuthSuccess;
