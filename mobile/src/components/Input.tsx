import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { colors, fonts, radius, space } from "@/theme";
import { AppText } from "./AppText";

interface Props extends TextInputProps { label?: string; error?: string | null; secure?: boolean; hint?: string }

export const Input = forwardRef<TextInput, Props>(function Input({ label, error, secure, hint, style, onFocus, onBlur, multiline, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.wrap}>
      {!!label && <AppText variant="caption" color="textSecondary">{label}</AppText>}
      <View style={[styles.field, focused && styles.focused, !!error && styles.err, multiline && { alignItems: "flex-start" }]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.cyan}
          secureTextEntry={hidden}
          autoCapitalize="none"
          multiline={multiline}
          {...rest}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, multiline && { minHeight: 96, textAlignVertical: "top" }, style]}
        />
        {secure && (
          <Pressable hitSlop={10} onPress={() => setHidden((h) => !h)} accessibilityLabel={hidden ? "Show password" : "Hide password"}>
            {hidden ? <Eye size={18} color={colors.textMuted} /> : <EyeOff size={18} color={colors.textMuted} />}
          </Pressable>
        )}
      </View>
      {!!error ? <AppText variant="caption" color="error">{error}</AppText> : !!hint ? <AppText variant="caption" color="textMuted">{hint}</AppText> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  field: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md },
  focused: { borderColor: colors.cyan },
  err: { borderColor: colors.error },
  input: { flex: 1, minHeight: 50, color: colors.text, fontFamily: fonts.body, fontSize: 15 },
});
