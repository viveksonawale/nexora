import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radius, space } from "@/theme";
import { AppText } from "./AppText";

type Variant = "primary" | "secondary" | "ghost" | "danger";
interface Props { label: string; onPress: () => void; variant?: Variant; loading?: boolean; disabled?: boolean; icon?: ReactNode; style?: ViewStyle; compact?: boolean }

export function Button({ label, onPress, variant = "primary", loading, disabled, icon, style, compact }: Props) {
  const off = disabled || loading;
  const textColor = variant === "primary" ? "onAccent" : variant === "danger" ? "error" : "text";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.base, compact && styles.compact, styles[variant], variant === "primary" && styles.glow, pressed && { opacity: 0.85 }, off && { opacity: 0.5 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.onAccent : colors.cyan} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText variant="bodyStrong" color={textColor}>{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: space.lg },
  compact: { minHeight: 40, paddingHorizontal: space.md },
  content: { flexDirection: "row", gap: space.sm, alignItems: "center" },
  primary: { backgroundColor: colors.cyan },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderActive },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.error },
  glow: { shadowColor: colors.cyan, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
});
