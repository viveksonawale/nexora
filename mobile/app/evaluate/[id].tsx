import { useEffect, useState } from "react";
import { Alert, Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Minus, Plus } from "lucide-react-native";
import { judgeApi } from "@/api/judgeApi";
import { AppText, Button, Card, ErrorState, Input, LoadingState, Screen, ScreenHeader } from "@/components";
import { useAsync } from "@/hooks/useAsync";
import { colors, space } from "@/theme";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export default function EvaluateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useAsync(() => judgeApi.submissions(), []);
  const item = q.data?.items.find((i) => i.id === id);
  const [score, setScore] = useState("50");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item?.myEvaluation) { setScore(String(item.myEvaluation.score)); setComments(item.myEvaluation.comments); }
  }, [item]);

  const n = clamp(parseInt(score || "0", 10) || 0);

  async function save() {
    if (!item) return;
    setSaving(true); setError(null);
    try {
      await judgeApi.evaluate(item.id, { score: n, comments });
      Alert.alert("Evaluation saved", `${item.projectCode} scored ${n}/100.`, [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the evaluation."); }
    finally { setSaving(false); }
  }

  if (q.loading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (q.error && !q.data) return <Screen><ScreenHeader title="Evaluate" back /><ErrorState error={q.error} onRetry={q.reload} /></Screen>;
  if (!item) return <Screen><ScreenHeader title="Evaluate" back /><ErrorState error={new Error("This project is no longer assigned to you.")} /></Screen>;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={item.projectCode} subtitle={item.hackathon.name} back />
      <View style={{ gap: space.lg }}>
        <Card>
          <AppText variant="heading">{item.title}</AppText>
          {!!item.description && <AppText color="textSecondary">{item.description}</AppText>}
        </Card>
        {!!item.repoUrl && <Button label="Open repository" variant="secondary" compact onPress={() => Linking.openURL(item.repoUrl)} />}
        {!!item.demoUrl && <Button label="Open demo" variant="secondary" compact onPress={() => Linking.openURL(item.demoUrl)} />}

        <View style={{ gap: 6 }}>
          <AppText variant="caption" color="textSecondary">Score (0 to 100)</AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Button label="" icon={<Minus size={18} color={colors.text} />} variant="secondary" compact onPress={() => setScore(String(clamp(n - 5)))} style={{ width: 52 }} />
            <View style={{ flex: 1 }}><Input value={String(n)} onChangeText={(t) => setScore(t.replace(/\D/g, "").slice(0, 3))} keyboardType="number-pad" style={{ textAlign: "center", fontFamily: "JetBrainsMono_500Medium", fontSize: 22 }} /></View>
            <Button label="" icon={<Plus size={18} color={colors.text} />} variant="secondary" compact onPress={() => setScore(String(clamp(n + 5)))} style={{ width: 52 }} />
          </View>
        </View>
        <Input label="Comments" value={comments} onChangeText={setComments} multiline autoCapitalize="sentences" />
        {!!error && <AppText variant="caption" color="error">{error}</AppText>}
        <Button label={item.myEvaluation ? "Update evaluation" : "Submit evaluation"} onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}
