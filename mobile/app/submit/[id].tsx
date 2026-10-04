import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { hackathonApi } from "@/api/hackathonApi";
import { AppText, Button, Card, ErrorState, Input, LoadingState, Screen, ScreenHeader } from "@/components";
import { useAsync } from "@/hooks/useAsync";
import { space } from "@/theme";

export default function SubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useAsync(() => hackathonApi.getSubmission(id), [id]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const existing = q.data?.submission ?? null;

  useEffect(() => {
    if (existing) { setTitle(existing.title); setDescription(existing.description); setRepoUrl(existing.repoUrl); setDemoUrl(existing.demoUrl); }
  }, [existing]);

  async function save() {
    if (title.trim().length < 2) return setError("Give your project a title.");
    setSaving(true); setError(null);
    try {
      await hackathonApi.saveSubmission(id, { title: title.trim(), description, repoUrl: repoUrl.trim(), demoUrl: demoUrl.trim() });
      Alert.alert("Submission saved", "Judges will see it under an anonymous project ID.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the submission."); }
    finally { setSaving(false); }
  }

  if (q.loading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (q.error && !q.data) return <Screen><ScreenHeader title="Submit project" back /><ErrorState error={q.error} onRetry={q.reload} /></Screen>;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={existing ? "Edit submission" : "Submit project"} back />
      <View style={{ gap: space.lg }}>
        {existing && <Card><AppText variant="caption" color="textSecondary">Your anonymous project ID</AppText><AppText variant="title" color="cyan" style={{ fontFamily: "JetBrainsMono_500Medium" }}>{existing.projectCode}</AppText></Card>}
        <Input label="Project title" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
        <Input label="Description" value={description} onChangeText={setDescription} multiline autoCapitalize="sentences" />
        <Input label="Repository URL" value={repoUrl} onChangeText={setRepoUrl} keyboardType="url" />
        <Input label="Demo URL" value={demoUrl} onChangeText={setDemoUrl} keyboardType="url" />
        {!!error && <AppText variant="caption" color="error">{error}</AppText>}
        <Button label="Save submission" onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}
