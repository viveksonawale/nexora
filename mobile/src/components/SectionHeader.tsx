import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { space } from "@/theme";

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <AppText variant="heading">{title}</AppText>
      {!!action && <Pressable hitSlop={10} onPress={onAction}><AppText variant="caption" color="cyan">{action}</AppText></Pressable>}
    </View>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.xl, marginBottom: space.md } });
