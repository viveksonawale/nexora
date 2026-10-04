import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors, space } from "@/theme";
import { AppText } from "./AppText";

interface Props { title: string; subtitle?: string; back?: boolean; right?: ReactNode }

export function ScreenHeader({ title, subtitle, back, right }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      {back && (
        <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.back}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
      )}
      <View style={styles.titles}>
        <AppText variant="title" numberOfLines={1}>{title}</AppText>
        {!!subtitle && <AppText variant="body" color="textSecondary" numberOfLines={2}>{subtitle}</AppText>}
      </View>
      {right}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.lg },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  titles: { flex: 1, gap: 2 },
});
