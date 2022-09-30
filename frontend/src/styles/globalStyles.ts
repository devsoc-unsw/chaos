import tw, { globalStyles } from "twin.macro";

import { globalCss } from "../../stitches.config";

import type { TwStyle } from "twin.macro";

const customStyles = {
  body: tw`antialiased font-sans!`,
};

const styles = () => {
  globalCss(customStyles)();
  globalCss(globalStyles as Record<string, TwStyle>)();
};

export default styles;
