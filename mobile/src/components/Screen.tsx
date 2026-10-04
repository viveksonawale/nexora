import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, space } from "@/theme";
import { NetworkBanner } from "./NetworkBanner";

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
}

/** Base screen: dark background, safe areas, optional scroll + pull-to-refresh, keyboard handling. */
export function Screen({ children, scroll = true, padded = true, edges = ["top"], refreshing, onRefresh, style }: Props) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.padded, styles.grow, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.cyan} colors={[colors.cyan]} progressBackgroundColor={colors.surface} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <NetworkBanner />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>{inner}</KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grow: { flexGrow: 1 },
  fill: { flex: 1 },
  padded: { padding: space.lg, paddingBottom: space.xxl },
});
