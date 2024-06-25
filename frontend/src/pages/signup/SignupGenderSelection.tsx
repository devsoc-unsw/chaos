import tw from "twin.macro";

import type { ReactNode } from "react";
import type React from "react";

const Select = tw.select`hocus:border-blue-300 form-select w-96 rounded-md border-gray-300 shadow-sm transition focus:ring focus:ring-blue-200/50`;

const Label = tw.label`flex flex-col`;
const LabelText: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span tw="text-gray-700">{children}</span>
);

export default Object.assign(Select, { Label, LabelText });
