import { colors, fonts } from "@/theme";

/** Shared look for all three role tab bars. */
export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.cyan,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: { backgroundColor: colors.bgAlt, borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
  tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
} as const;
