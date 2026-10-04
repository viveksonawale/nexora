import { Pressable, StyleSheet } from "react-native";
import { colors, radius, space } from "@/theme";
import { AppText } from "./AppText";

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]} accessibilityState={{ selected: !!active }}>
      <AppText variant="caption" color={active ? "cyan" : "textSecondary"}>{label}</AppText>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  active: { borderColor: colors.cyan, backgroundColor: "#06222B" },
});
