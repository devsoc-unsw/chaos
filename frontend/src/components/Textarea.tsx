import tw from "twin.macro";

const Textarea = tw.textarea`
  block w-full mt-1 rounded-md
  border-gray-300 shadow-sm
  transition
  focus:(border-blue-300 ring ring-blue-200 ring-opacity-50)
`;

export default Textarea;
