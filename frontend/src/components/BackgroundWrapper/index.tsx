import { Box, useTheme } from "@mui/system";
import type { PropsWithChildren } from "react";

const BackgroundWrapper = ({ children }: PropsWithChildren) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.grey[900],
      }}
    >
      {children}
    </Box>
  );
};

export default BackgroundWrapper;
