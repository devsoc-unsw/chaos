import "twin.macro";
import Textarea from "components/Textarea";

import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Textarea> & {
  preview: boolean;
  renderEmail: () => string;
};
const Email = ({ preview, renderEmail, ...props }: Props) =>
  preview ? (
    <div tw="px-3 py-2 rounded-md min-h-[12rem] bg-white border border-gray-300 shadow-sm whitespace-pre-wrap">
      {renderEmail()}
    </div>
  ) : (
    <Textarea size="lg" {...props} />
  );

export default Email;
