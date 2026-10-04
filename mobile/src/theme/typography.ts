export const fonts = {
  display: "Manrope_800ExtraBold",
  heading: "Manrope_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  mono: "JetBrainsMono_500Medium",
} as const;

export const type = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 17 },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 },
} as const;
export type TypeVariant = keyof typeof type;
