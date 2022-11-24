import tw from "twin.macro";

import type { PropsWithChildren } from "react";

const Input = tw.input`
  form-input w-96 rounded-md
  border-gray-300 shadow-sm
  transition hocus:border-blue-300 focus:(ring ring-blue-200/50)

  invalid:(
    border-red-300 text-red-600 ring-red-200/50
    hover:(border-red-400)
  )
`;
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
