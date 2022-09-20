import PropTypes from "prop-types";
import tw, { styled } from "twin.macro";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

const ButtonShadow = tw.div`
  filter blur-sm
  group-hover:(blur translate-y-0.5) group-focus-visible:blur group-active:blur-sm
`;

const ButtonBg = tw.div`
  opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100
`;

const Button = styled.button({
  ...tw`
    relative flex justify-center items-center
    px-3 py-2 w-max
    text-[#191d24] font-normal border-0 rounded outline-none ring-blue-500 transition
    hover:text-black focus-visible:(ring text-black)
  `,

  [`& > ${ButtonBg}, ${ButtonShadow}`]: tw`
    absolute inset-0 z-[-1]
    rounded transition
    bg-gradient-120 from-fuchsia-200 to-indigo-200
  `,
});

const DashboardButton = ({ children, ...props }) => (
  <Button className="group" {...props}>
    <ButtonShadow />
    <ButtonBg />
    <ChevronRightIcon tw="h-6 w-6" />
    {children}
  </Button>
);

DashboardButton.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardButton;
