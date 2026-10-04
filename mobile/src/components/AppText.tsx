import { Text, type TextProps } from "react-native";
import { colors, type, type TypeVariant } from "@/theme";

interface Props extends TextProps { variant?: TypeVariant; color?: keyof typeof colors }

export function AppText({ variant = "body", color = "text", style, ...rest }: Props) {
  return <Text {...rest} style={[type[variant], { color: colors[color] }, style]} />;
}
