import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { aiApi } from "@/api/aiApi";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { colors, space } from "@/theme";
import type { AiSummary } from "@/types/api";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Card } from "./Card";

/** Summarizes a problem statement: short summary plus key points. */
export function AiSummaryBox({ text }: { text: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tooShort = text.trim().length < 40;

  async function run() {
    if (!user) return router.push("/(auth)/login");
    setLoading(true); setError(null);
    try { setResult(await aiApi.summarize(text)); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Could not summarize"); }
    finally { setLoading(false); }
  }

  return (
    <View style={{ gap: space.md }}>
      <Button label="Summarize with AI" variant="secondary" icon={<Sparkles size={16} color={colors.cyan} />} onPress={run} loading={loading} disabled={tooShort} />
      {tooShort && <AppText variant="caption" color="textMuted">Add at least a couple of sentences to summarize.</AppText>}
      {!!error && <AppText variant="caption" color="error">{error}</AppText>}
      {result && (
        <Card>
          <AppText variant="bodyStrong">Summary</AppText>
          <AppText color="textSecondary">{result.summary}</AppText>
          <AppText variant="bodyStrong" style={{ marginTop: space.sm }}>Key points</AppText>
          {result.keyPoints.map((k, i) => (
            <AppText key={i} color="textSecondary">{`\u2022  ${k}`}</AppText>
          ))}
        </Card>
      )}
    </View>
  );
}
