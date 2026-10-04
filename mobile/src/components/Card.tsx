import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radius, space } from "@/theme";

interface Props { children: ReactNode; onPress?: () => void; selected?: boolean; style?: ViewStyle }

export function Card({ children, onPress, selected, style }: Props) {
  const base = [styles.card, selected && styles.selected, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { backgroundColor: colors.elevated }]}>{children}</Pressable>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.sm },
  selected: { borderColor: colors.borderActive, shadowColor: colors.cyan, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
});
