import { Transition as HeadlessUiTransition } from "@headlessui/react";
import { css } from "twin.macro";

/**
 * HeadlessUI "Transition"
 * Customized for twin.macro + typescript
 * https://headlessui.dev/react/transition
 */

const toCss = (styles) => css(styles).toString();

const getProps = (props) => {
  return {
    show: true,
    ...props,
    enter: toCss(props.enter),
    enterFrom: toCss(props.enterFrom),
    enterTo: toCss(props.enterTo),
    entered: toCss(props.entered),
    leave: toCss(props.leave),
    leaveFrom: toCss(props.leaveFrom),
    leaveTo: toCss(props.leaveTo),
    beforeEnter: () => props.beforeEnter?.(),
    afterEnter: () => props.afterEnter?.(),
    beforeLeave: () => props.beforeLeave?.(),
    afterLeave: () => props.afterLeave?.(),
  };
};

const Transition = (props) => <HeadlessUiTransition {...getProps(props)} />;

Transition.Child = (props) => (
  <HeadlessUiTransition.Child {...getProps(props)} />
);

export default Transition;
