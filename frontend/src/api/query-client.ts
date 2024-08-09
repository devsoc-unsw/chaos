import { QueryClient } from "@tanstack/react-query";

const defaultQueryConfig = {} as const;

const queryClient = new QueryClient({
  defaultOptions: { queries: defaultQueryConfig },
});

export default queryClient;
