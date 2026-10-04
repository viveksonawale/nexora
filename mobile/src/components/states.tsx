import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AlertTriangle, WifiOff } from "lucide-react-native";
import type { ApiError } from "@/api/client";
import { colors, space } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.cyan} size="large" />
      <AppText variant="caption" color="textMuted">{label}</AppText>
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError | Error; onRetry?: () => void }) {
  const offline = (error as ApiError).isNetwork;
  return (
    <View style={styles.center}>
      {offline ? <WifiOff size={30} color={colors.warning} /> : <AlertTriangle size={30} color={colors.error} />}
      <AppText variant="heading">{offline ? "You're offline" : "Something went wrong"}</AppText>
      <AppText color="textSecondary" style={styles.msg}>{error.message}</AppText>
      {onRetry && <Button label="Try again" variant="secondary" onPress={onRetry} compact />}
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message?: string; action?: ReactNode }) {
  return (
    <View style={styles.center}>
      {icon}
      <AppText variant="heading">{title}</AppText>
      {!!message && <AppText color="textSecondary" style={styles.msg}>{message}</AppText>}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: space.md, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  msg: { textAlign: "center" },
});
