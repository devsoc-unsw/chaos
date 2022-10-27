import { LinearProgress } from "@mui/material";
import "twin.macro";

const LoadingIndicator = () => (
  <div tw="flex flex-col flex-1 h-full">
    <LinearProgress />
    <div tw="flex items-center justify-center flex-1">Loading...</div>
  </div>
);

export default LoadingIndicator;
