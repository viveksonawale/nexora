import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { QrCode } from "lucide-react-native";
import { organizerApi } from "@/api/organizerApi";
import { AppText, Avatar, Button, Card, EmptyState, ErrorState, Input, LoadingState, Screen, ScreenHeader, SectionHeader, StatCard, StatusBadge } from "@/components";
import { useAsync } from "@/hooks/useAsync";
import { colors, space } from "@/theme";
import { formatDateTime } from "@/utils/format";
import { isEmail } from "@/utils/validation";

export default function EventManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useAsync(() => organizerApi.manage(id), [id], { refetchOnFocus: true });
  const [judgeEmail, setJudgeEmail] = useState("");
  const [judgeMsg, setJudgeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  async function addJudge() {
    if (!isEmail(judgeEmail)) return setJudgeMsg({ ok: false, text: "Enter the judge's email address." });
    setAdding(true); setJudgeMsg(null);
    try { await organizerApi.addJudge(id, judgeEmail.trim().toLowerCase()); setJudgeEmail(""); setJudgeMsg({ ok: true, text: "Judge assigned." }); q.refresh(); }
    catch (e) { setJudgeMsg({ ok: false, text: e instanceof Error ? e.message : "Could not assign the judge." }); }
    finally { setAdding(false); }
  }

  if (q.loading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (q.error || !q.data) return <Screen><ScreenHeader title="Event" back /><ErrorState error={q.error ?? new Error("Not found")} onRetry={q.reload} /></Screen>;
  const { hackathon: h, stats, timeline, participants, judges, results } = q.data;

  return (
    <Screen edges={["top", "bottom"]} refreshing={q.refreshing} onRefresh={q.refresh}>
      <ScreenHeader title={h.name} back />
      <View style={{ gap: space.lg }}>
        <StatusBadge status={h.status} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          <StatCard label="Registrations" value={stats.registrations} />
          <StatCard label="Submissions" value={stats.submissions} />
          <StatCard label="Judges" value={stats.judges} />
          <StatCard label="Evaluations" value={stats.evaluations} />
        </View>
        <Button label="Attendance" icon={<QrCode size={18} color={colors.onAccent} />} onPress={() => router.push(`/attendance-control/${id}`)} />

        <SectionHeader title="Timeline" />
        <Card>{timeline.map((t) => (
          <View key={t.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <AppText color="textSecondary">{t.label}</AppText><AppText variant="mono">{formatDateTime(t.at)}</AppText>
          </View>
        ))}</Card>

        <SectionHeader title="Judges" />
        <Card>
          {judges.length === 0 && <AppText color="textSecondary">No judges assigned yet.</AppText>}
          {judges.map((j) => <AppText key={j.email}>{j.name} <AppText variant="caption" color="textMuted">{j.email}</AppText></AppText>)}
        </Card>
        <Input label="Assign a judge by email" value={judgeEmail} onChangeText={setJudgeEmail} keyboardType="email-address" hint="The judge must have signed up as a Judge." />
        {!!judgeMsg && <AppText variant="caption" color={judgeMsg.ok ? "success" : "error"}>{judgeMsg.text}</AppText>}
        <Button label="Assign judge" variant="secondary" onPress={addJudge} loading={adding} />

        <SectionHeader title="Results" />
        {results.length === 0 ? <EmptyState title="No submissions yet" message="Results appear here once participants submit and judges score." /> : (
          <View style={{ gap: space.sm }}>
            {results.map((r) => (
              <Card key={r.projectCode}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="mono" color="cyan">{r.projectCode}</AppText>
                  <AppText variant="mono">{r.averageScore === null ? "Not scored" : `${r.averageScore} avg`}</AppText>
                </View>
                <AppText variant="bodyStrong">{r.title}</AppText>
                <AppText variant="caption" color="textSecondary">{r.team} · {r.evaluations} evaluation{r.evaluations === 1 ? "" : "s"}</AppText>
              </Card>
            ))}
          </View>
        )}

        <SectionHeader title={`Participants (${participants.length})`} />
        {participants.length === 0 ? <AppText color="textSecondary">No one has registered yet.</AppText> : participants.map((p) => (
          <View key={p.email} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Avatar name={p.name} size={34} />
            <View style={{ flex: 1 }}><AppText variant="bodyStrong">{p.name}</AppText><AppText variant="caption" color="textSecondary">{p.college || p.email}</AppText></View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
