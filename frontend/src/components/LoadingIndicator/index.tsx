import { LinearProgress } from "@mui/material";
import "twin.macro";

const LoadingIndicator = () => (
  <div tw="flex h-full flex-1 flex-col">
    <LinearProgress />
    <div tw="flex flex-1 items-center justify-center">Loading...</div>
  </div>
);

export default LoadingIndicator;
