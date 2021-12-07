import React from "react";
import { useLocation } from "react-router-dom";
// stolen from
// https://v5.reactrouter.com/web/example/query-parameters

// A custom hook that builds on useLocation to parse
// the query string for you.
const useQuery = () => {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
};

export default useQuery;
