import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { judgeApi } from "@/api/judgeApi";
import { AppText, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from "@/components";
import { useAsync } from "@/hooks/useAsync";
import { colors, space } from "@/theme";

export default function JudgeProjects() {
  const router = useRouter();
  const q = useAsync(() => judgeApi.submissions(), [], { refetchOnFocus: true });
  const items = q.data?.items ?? [];
  const done = items.filter((i) => i.myEvaluation).length;

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <ScreenHeader title="Projects" subtitle="Blind review: submitter details are hidden." />
      {q.loading ? <LoadingState /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> :
        items.length === 0 ? <EmptyState icon={<ClipboardList size={30} color={colors.textMuted} />} title="Nothing to review" message="Projects appear here once an organizer assigns you to a hackathon and participants submit." /> : (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 6 }}>
              <AppText variant="mono" color="textSecondary">{done} of {items.length} evaluated</AppText>
              <View style={styles.track}><View style={[styles.fill, { width: `${(done / items.length) * 100}%` }]} /></View>
            </View>
            {items.map((s) => (
              <Card key={s.id} onPress={() => router.push(`/evaluate/${s.id}`)} selected={!s.myEvaluation}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="mono" color="cyan">{s.projectCode}</AppText>
                  <AppText variant="mono" color={s.myEvaluation ? "success" : "textMuted"}>{s.myEvaluation ? `${s.myEvaluation.score}/100` : "Not scored"}</AppText>
                </View>
                <AppText variant="heading">{s.title}</AppText>
                <AppText variant="caption" color="textSecondary">{s.hackathon.name}</AppText>
              </Card>
            ))}
          </View>
        )}
    </Screen>
  );
}
const styles = StyleSheet.create({ track: { height: 4, borderRadius: 2, backgroundColor: colors.border }, fill: { height: 4, borderRadius: 2, backgroundColor: colors.cyan } });
