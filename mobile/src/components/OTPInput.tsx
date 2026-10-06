import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, radius, space } from "@/theme";
import { AppText } from "./AppText";

interface Props { value: string; onChange: (v: string) => void; length?: number; autoFocus?: boolean }

export function OTPInput({ value, onChange, length = 6, autoFocus = true }: Props) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="One-time code">
      <View style={styles.row}>
        {Array.from({ length }).map((_, i) => {
          const active = focused && i === Math.min(value.length, length - 1);
          return (
            <View key={i} style={[styles.box, active && styles.active, !!value[i] && styles.filled]}>
              <AppText variant="title" style={styles.digit}>{value[i] ?? ""}</AppText>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.sm, justifyContent: "space-between" },
  box: { flex: 1, aspectRatio: 0.85, maxWidth: 58, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  active: { borderColor: colors.cyan },
  filled: { borderColor: colors.borderActive },
  digit: { fontFamily: "JetBrainsMono_500Medium" },
  hidden: { ...StyleSheet.absoluteFill, opacity: 0 },
});
