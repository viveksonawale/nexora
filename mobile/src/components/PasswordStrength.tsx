import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { passwordStrength } from "@/utils/validation";
import { AppText } from "./AppText";

const tones = [colors.error, colors.error, colors.warning, colors.success, colors.success];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= score ? tones[score] : colors.border }]} />
        ))}
      </View>
      <AppText variant="caption" color="textSecondary">{label}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({ bars: { flexDirection: "row", gap: 6 }, bar: { flex: 1, height: 4, borderRadius: 2 } });
