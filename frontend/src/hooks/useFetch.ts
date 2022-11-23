import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { MessagePopupContext } from "contexts/MessagePopupContext";
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
  status?: number;
  error: boolean;
  errorMsg?: string;
  aborted: boolean;
} & ({ error: true; errorMsg: string } | { error: false; errorMsg: undefined });

type Options<T> = Parameters<typeof fetch>[1] & {
  headers?: { [k: string]: string };
  abortBehaviour?: AbortBehaviour;
  deps?: unknown[];
  body?: Json;
  errorPopup?: boolean;
  errorSummary?: string;
  onSuccess?: (_data: T) => unknown;
  onError?: (_data: string) => unknown;
} & (T extends void ? { jsonResp: false } : { jsonResp?: true });
const useFetch = <T = void>(url: string, options?: Options<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(0);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [_, setRetry] = useState({});

  const [abortBehaviour] = useState(options?.abortBehaviour ?? "all");
  const controllers = useRef<Controllers>({});

  const pushMessage = useContext(MessagePopupContext);

  const refetch = useCallback(() => {
    setRetry({});
  }, []);

  const external = !url.startsWith("/");
  const baseUrl = !external ? `${window.origin}/api${url}` : url;

  const doFetch = useCallback(
    async (url = "", options?: Options<T>): Promise<FetchReturn<T>> => {
      const controller = getController(
        url,
        controllers.current,
        abortBehaviour
      );

      let data;
      let status;
      let error = false;
      let errorMsg: string | undefined;

      setLoading(true);
      setError(error);

      // TODO: move auth tokens to cookies
      const token = getStore("AUTH_TOKEN");
      const { headers, ...init } = options ?? {};

      try {
        const resp = await fetch(`${baseUrl}/${url}`, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ...(token && !external && { Authorization: `Bearer ${token}` }),
            ...headers,
          },
          ...init,
          body: JSON.stringify(options?.body),
          signal: controller?.signal,
        });
        status = resp.status;
        setStatus(status);
        if (!resp.ok) {
          throw new Error(await resp.text());
        }

        if (!(options?.jsonResp === false)) {
          try {
            data = (await resp.json()) as T;
          } catch (e) {
            throw new Error("Error parsing response from server");
          }

          setData(data);
          options?.onSuccess?.(data);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return { error: false, errorMsg: undefined, aborted: true };
        }

        error = true;
        setError(true);
        if (e instanceof Error) {
          errorMsg = e.message;
        }

        if (!errorMsg) {
          errorMsg = "unknown error";
        }
        setErrorMsg(errorMsg);

        options?.onError?.(errorMsg);
        if (options?.errorPopup || options?.errorSummary) {
          let message = errorMsg;
          if (options?.errorSummary) {
            message = `${options.errorSummary}: ${message}`;
          }
          pushMessage({
            type: "error",
            message,
          });
        }
      } finally {
        setLoading(false);
      }

      return {
        data,
        status,
        error,
        errorMsg,
        aborted: false,
      } as FetchReturn<T>;
    },
    []
  );

  useEffect(() => {
    if (options?.deps === undefined) {
      return;
    }

    void doFetch("", options);
  }, [url, options?.body, ...(options?.deps ?? [])]);

  const outerOptions = options;
  const makeFetch = useCallback(
    (method: string) =>
      (
        url: string,
        options?: Omit<Options<T>, "jsonResp" | "abortBehaviour" | "deps">
      ) =>
        doFetch(url, { ...outerOptions, ...options, method } as Options<T>),
    [url, options?.body]
  );

  return {
    data,
    loading,
    status,
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
