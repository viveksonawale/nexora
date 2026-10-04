import { StyleSheet, View } from "react-native";
import { colors, radius, space } from "@/theme";
import { AppText } from "./AppText";

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.c}>
      <AppText variant="title" style={{ fontFamily: "JetBrainsMono_500Medium", color: colors.cyan }}>{value}</AppText>
      <AppText variant="caption" color="textSecondary">{label}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, minWidth: 140, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: 2 },
});
