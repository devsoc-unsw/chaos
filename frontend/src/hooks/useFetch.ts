/// <reference types="vite/client" />
import { useCallback, useEffect, useRef, useState } from "react";
import type { Json } from "types/api";

type Controllers = {
  [key: string]: AbortController;
};

type AbortBehaviour = "all" | "last" | "none";

type Options<T> = {
  method?: string;
  headers?: { [k: string]: string };
  body?: Json;
  abortBehaviour?: AbortBehaviour;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

type FetchReturn<T> = {
  data: T | null;
  status: number;
  error: boolean;
  errorMsg?: string;
};

const getController = (
  url: string,
  controllers: Controllers,
  abortBehaviour: AbortBehaviour
): AbortController | undefined => {
  if (abortBehaviour === "none") return undefined;

  if (abortBehaviour === "all") {
    Object.values(controllers).forEach((controller) => controller.abort());
  }

  const controller = new AbortController();
  controllers[url] = controller;
  return controller;
};

const useFetch = <T = void>(url: string, options?: Options<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(0);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [_, setRetry] = useState({});

  const [abortBehaviour] = useState(options?.abortBehaviour ?? "all");
  const controllers = useRef<Controllers>({});

  const refetch = useCallback(() => {
    setRetry({});
  }, []);

  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  const endpoint = !url.startsWith("/") ? `${baseUrl}/${url}` : `${baseUrl}${url}`;

  const doFetch = useCallback(
    async (url = "", options?: Options<T>): Promise<FetchReturn<T>> => {
      const controller = getController(
        url,
        controllers.current,
        abortBehaviour
      );

      let data: T | null = null;
      let status = 0;
      let error = false;
      let errorMsg: string | undefined;

      setLoading(true);
      setError(error);

      const { headers, body, ...init } = options ?? {};

      try {
        const response = await fetch(endpoint, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          credentials: 'include',
          signal: controller?.signal,
          body: body ? JSON.stringify(body) : undefined,
        });

        status = response.status;
        setStatus(status);

        if (!response.ok) {
          error = true;
          setError(error);
          const errorData = await response.json();
          errorMsg = errorData.message ?? "An error occurred";
          setErrorMsg(errorMsg);
          options?.onError?.(new Error(errorMsg));
          return { data: null, status, error, errorMsg };
        }

        data = await response.json();
        setData(data);
        options?.onSuccess?.(data);
      } catch (e) {
        error = true;
        setError(error);
        errorMsg = e instanceof Error ? e.message : "An error occurred";
        setErrorMsg(errorMsg);
        options?.onError?.(e instanceof Error ? e : new Error(errorMsg));
      } finally {
        setLoading(false);
      }

      return { data, status, error, errorMsg };
    },
    [endpoint, abortBehaviour]
  );

  useEffect(() => {
    void doFetch(url, options);
    return () => {
      Object.values(controllers.current).forEach((controller) =>
        controller.abort()
      );
    };
  }, [doFetch, url, options, _]);

  return {
    data,
    loading,
    status,
    error,
    errorMsg,
    refetch,
  };
};

export default useFetch;
