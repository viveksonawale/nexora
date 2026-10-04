import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";
import type { HackathonStatus } from "@/types/api";
import { statusLabel } from "@/utils/format";
import { AppText } from "./AppText";

const tone: Record<HackathonStatus, string> = { LIVE: colors.success, OPEN: colors.cyan, UPCOMING: colors.purple, ENDED: colors.textMuted };

export function StatusBadge({ status }: { status: HackathonStatus }) {
  const c = tone[status];
  return (
    <View style={[styles.badge, { borderColor: c + "66", backgroundColor: c + "1A" }]}>
      <View style={[styles.dot, { backgroundColor: c }]} />
      <AppText variant="caption" style={{ color: c }}>{statusLabel[status]}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
