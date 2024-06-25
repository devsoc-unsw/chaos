import tw, { styled } from "twin.macro";

import { TypographyH5 } from "components/Typography";

export const Question = tw.p`font-bold`;

export const Answer = tw.p`mb-4`;

export const NoAnswer = tw.p`mb-4 italic text-gray-600`;

export const Zid = styled(TypographyH5, tw`mb-2`);
