import tw from "twin.macro";

import type { PropsWithChildren } from "react";

const Input = tw.input`hocus:border-blue-300 form-input w-96 rounded-md border-gray-300 shadow-sm transition invalid:border-red-300 invalid:text-red-600 invalid:ring-red-200/50 invalid:hover:border-red-400 focus:ring focus:ring-blue-200/50`;
const Label = tw.label`flex flex-col`;

type LabelTextProps = {
  /**
   * Whether this form control is required.
   * If this is true, a red asterisk is shown next to the label text
   */
  required?: true;
};
const LabelText = ({
  required,
  children,
}: PropsWithChildren<LabelTextProps>) => (
  <span tw="text-gray-700">
    {children}
    {required && <span tw="text-red-600">*</span>}
  </span>
);

export default Object.assign(Input, { Label, LabelText });
