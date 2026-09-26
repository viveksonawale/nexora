import { StatefulButton } from "@/components/motion/button/stateful";
import { ComponentProps, forwardRef } from "react";

export const SaveButton = forwardRef<HTMLButtonElement, ComponentProps<typeof StatefulButton>>((props, ref) => {
  return <StatefulButton ref={ref} {...props} />;
});
SaveButton.displayName = "SaveButton";
