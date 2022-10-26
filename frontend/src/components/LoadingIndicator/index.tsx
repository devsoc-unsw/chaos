import { LinearProgress } from "@mui/material";
import "twin.macro";

const LoadingIndicator = () => (
  <div tw="flex flex-col flex-1">
    <LinearProgress />
    <div tw="flex items-center justify-center flex-1 h-full">Loading...</div>
  </div>
);

export default LoadingIndicator;
