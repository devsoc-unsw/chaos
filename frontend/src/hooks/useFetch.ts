import { useCallback, useEffect, useRef, useState } from "react";

import { getStore } from "utils";

import type { Json } from "types/api";

type AbortBehaviour = "all" | "sameUrl" | "never";
type Controllers = { [url: string]: AbortController };

const getController = (
  url: string,
  controllers: Controllers,
  abortBehaviour: AbortBehaviour
) => {
  let controllerName;
  switch (abortBehaviour) {
    case "never":
      return null;
    case "sameUrl":
      controllerName = url;
      break;
    default:
      controllerName = "default";
      break;
  }

  controllers[controllerName]?.abort();
  const controller = new AbortController();
  // eslint-disable-next-line no-param-reassign
  controllers[controllerName] = controller;
  return controller;
};

type FetchReturn<T> = {
  data?: T;
  error: boolean;
  errorMsg?: string;
  aborted: boolean;
} & ({ error: true; errorMsg: string } | { error: false; errorMsg: undefined });

type Options<T> = Parameters<typeof fetch>[1] & {
  headers?: { [k: string]: string };
  abortBehaviour?: AbortBehaviour;
} & (T extends void ? { jsonResp: false } : { jsonResp?: true });
const useFetch = <T = void>(
  url: string,
  body?: Json,
  options?: Options<T>,
  deps?: unknown[]
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [_, setRetry] = useState({});

  const [abortBehaviour] = useState(options?.abortBehaviour ?? "all");
  const controllers = useRef<Controllers>({});

  const refetch = useCallback(() => {
    setRetry({});
  }, []);

  const doFetch = useCallback(
    async (
      fetchUrl = "",
      options?: Options<T>,
      body?: Json
    ): Promise<FetchReturn<T>> => {
      const controller = getController(
        fetchUrl,
        controllers.current,
        abortBehaviour
      );

      let data;
      let error = false;
      let errorMsg: string | undefined;

      setLoading(true);
      setError(error);

      const token = getStore("AUTH_TOKEN");
      const baseUrl = url.startsWith("/") ? `${window.origin}/api${url}` : url;
      // eslint-disable-next-line no-param-reassign
      fetchUrl =
        fetchUrl.length === 0 || fetchUrl.startsWith("/")
          ? `${baseUrl}${fetchUrl}`
          : fetchUrl;
      const { headers, ...init } = options ?? {};

      let resp;
      try {
        console.log(fetchUrl);
        resp = await fetch(fetchUrl, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ...(token && { Authorization: `Bearer ${token}` }),
            ...headers,
          },
          ...init,
          body: JSON.stringify(body),
          signal: controller?.signal,
        });
        if (!resp.ok) {
          error = true;
          setError(true);
          errorMsg = await resp.text();
          setErrorMsg(errorMsg);
          return { error, errorMsg, aborted: false };
        }

        if (!(options?.jsonResp === false)) {
          try {
            data = (await resp.json()) as T;
          } catch (e) {
            setError(true);
          }

          setData(data as T);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return { error: false, errorMsg: undefined, aborted: true };
        }

        error = true;
        setError(true);
        if (e instanceof Error) {
          errorMsg = e.message;
        } else {
          errorMsg = "unknown error";
        }
        setErrorMsg(errorMsg);
      } finally {
        setLoading(false);
      }

      return { data, error, errorMsg, aborted: false } as FetchReturn<T>;
    },
    []
  );

  useEffect(() => {
    if (deps === undefined) {
      return;
    }

    void doFetch("", options, body);
  }, [url, body, ...(deps ?? [])]);

  const makeFetch = useCallback(
    (method: string) => (url: string, body?: Json, options?: Options<T>) =>
      doFetch(url, { ...options, method } as Options<T>, body),
    [url, body]
  );

  return {
    data,
    loading,
    error,
    errorMsg,
    refetch,

    get: makeFetch("get"),
    post: makeFetch("post"),
    del: makeFetch("delete"),
    put: makeFetch("put"),
    patch: makeFetch("patch"),
  };
};

export default useFetch;
