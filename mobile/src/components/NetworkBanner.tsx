import { StyleSheet, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useNetwork } from "@/hooks/useNetwork";
import { colors, space } from "@/theme";
import { AppText } from "./AppText";

export function NetworkBanner() {
  const { isOffline } = useNetwork();
  if (!isOffline) return null;
  return (
    <View style={styles.bar}>
      <WifiOff size={14} color={colors.warning} />
      <AppText variant="caption" color="warning">You are offline. Showing what was last loaded.</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  bar: { flexDirection: "row", gap: space.sm, alignItems: "center", justifyContent: "center", paddingVertical: 6, backgroundColor: "#2A1D06" },
});
