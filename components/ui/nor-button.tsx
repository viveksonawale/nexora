import { Button } from "@/components/motion/button/base";
import { ComponentProps, forwardRef } from "react";

export const NorButton = forwardRef<HTMLButtonElement, ComponentProps<typeof Button>>((props, ref) => {
  return <Button ref={ref} {...props} />;
});
NorButton.displayName = "NorButton";
