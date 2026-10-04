import { useState } from "react";
import { View } from "react-native";
import { AiSummaryBox, Input, Screen, ScreenHeader } from "@/components";
import { space } from "@/theme";

export default function AiSummaryScreen() {
  const [text, setText] = useState("");
  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="Problem statement summary" subtitle="Paste a problem statement to get a short summary and key points." back />
      <View style={{ gap: space.lg }}>
        <Input label="Problem statement" value={text} onChangeText={setText} multiline autoCapitalize="sentences" style={{ minHeight: 160 }} />
        <AiSummaryBox text={text} />
      </View>
    </Screen>
  );
}
