import BaseDropzone from "react-dropzone";
import tw from "twin.macro";

import type { ComponentProps, PropsWithChildren } from "react";

const Dropzone = ({
  children,
  ...props
}: PropsWithChildren<
  Omit<ComponentProps<typeof BaseDropzone>, "children">
>) => (
  <BaseDropzone
    accept={{
      "image/jpeg": [".jpeg"],
      "image/jpg": [".jpg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    }}
    minSize={1024}
    maxSize={3072000}
    {...props}
  >
    {({ getRootProps, getInputProps, isDragActive }) => (
      <section>
        <div
          tw="flex h-64 cursor-pointer items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center transition-colors hover:border-brand-600"
          css={{ ...(isDragActive && tw`border-brand-600`) }}
          // eslint-disable-next-line react/jsx-props-no-spreading -- this *should* be fine here
          {...getRootProps()}
        >
          {/* eslint-disable-next-line react/jsx-props-no-spreading -- this *should* be fine here */}
          <input {...getInputProps()} />
          {children}
        </div>
      </section>
    )}
  </BaseDropzone>
);

export default Dropzone;
