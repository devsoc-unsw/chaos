import "twin.macro";
import Textarea from "components/Textarea";

import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Textarea> & {
  preview: boolean;
  renderEmail: () => string;
  value: string;
};
const Email = ({ preview, renderEmail, ...props }: Props) =>
  preview ? (
    <div tw="mt-1 whitespace-pre-wrap px-3 py-2 rounded-md min-h-[12rem] bg-white border border-gray-300 shadow-sm">
      {renderEmail()}
    </div>
  ) : (
    <Textarea {...props} />
  );

export default Email;
