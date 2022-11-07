import { LinearProgress } from "@mui/material";
import "twin.macro";

const LoadingIndicator = () => (
  <div tw="flex flex-1 h-full flex-col">
    <LinearProgress />
    <div tw="flex flex-1 items-center justify-center">Loading...</div>
  </div>
);

export default LoadingIndicator;
