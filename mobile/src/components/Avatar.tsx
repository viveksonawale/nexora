import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { initials } from "@/utils/format";
import { AppText } from "./AppText";

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <View style={[styles.a, { width: size, height: size, borderRadius: size / 2 }]}>
      <AppText variant="caption" color="cyan" style={{ fontSize: size * 0.38 }}>{initials(name)}</AppText>
    </View>
  );
}

export function AvatarStack({ names, total }: { names: string[]; total: number }) {
  const extra = total - names.length;
  return (
    <View style={styles.stack}>
      {names.map((n, i) => (
        <View key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}><Avatar name={n} /></View>
      ))}
      {extra > 0 && <AppText variant="caption" color="textSecondary" style={{ marginLeft: 8 }}>+{extra}</AppText>}
    </View>
  );
}
const styles = StyleSheet.create({
  a: { backgroundColor: colors.elevated, borderWidth: 1.5, borderColor: colors.bg, alignItems: "center", justifyContent: "center" },
  stack: { flexDirection: "row", alignItems: "center" },
});
