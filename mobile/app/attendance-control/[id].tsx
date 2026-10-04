import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { attendanceApi, type AttendanceAction } from "@/api/attendanceApi";
import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, StatCard } from "@/components";
import { useAsync } from "@/hooks/useAsync";
import { buildAttendanceQr } from "@/services/attendanceService";
import { space } from "@/theme";
import { formatDateTime } from "@/utils/format";

export default function AttendanceControlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useAsync(() => attendanceApi.organizerState(id), [id], { intervalMs: 5000, refetchOnFocus: true });
  const [qr, setQr] = useState<{ token: string; at: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metrics poll every 5s, but the QR image only changes every ~25s (tokens last 45s), so it stays steady to scan.
  useEffect(() => {
    const t = q.data?.qr;
    if (!t) return setQr(null);
    setQr((prev) => (!prev || Date.now() - prev.at > 25000 ? { token: t.token, at: Date.now() } : prev));
  }, [q.data]);

  async function act(action: AttendanceAction) {
    setBusy(true); setError(null);
    try { await attendanceApi.control(id, action); q.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Action failed."); }
    finally { setBusy(false); }
  }
  const confirmEnd = () => Alert.alert("End attendance?", "Students will no longer be able to mark attendance for this session.", [{ text: "Cancel", style: "cancel" }, { text: "End session", style: "destructive", onPress: () => void act("end") }]);

  if (q.loading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (q.error && !q.data) return <Screen><ScreenHeader title="Attendance" back /><ErrorState error={q.error} onRetry={q.reload} /></Screen>;
  const s = q.data!;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="Attendance session" back />
      <View style={{ gap: space.lg }}>
        {!s.session ? (
          <>
            <EmptyState title="No session running" message={`${s.registered} participant${s.registered === 1 ? " is" : "s are"} registered. Start a session to show the QR code.`} />
            <Button label="Start attendance" onPress={() => act("start")} loading={busy} />
          </>
        ) : (
          <>
            <AppText variant="caption" color={s.session.status === "ACTIVE" ? "success" : "warning"}>
              {s.session.status === "ACTIVE" ? "Active" : "Paused"} since {formatDateTime(s.session.startedAt)}
            </AppText>
            <View style={{ flexDirection: "row", gap: space.md }}>
              <StatCard label="Present" value={s.present} />
              <StatCard label="Registered" value={s.registered} />
            </View>
            {qr ? (
              <View style={{ alignItems: "center", backgroundColor: "#FFFFFF", padding: space.lg, borderRadius: 16, alignSelf: "center" }}>
                <QRCode value={buildAttendanceQr(qr.token)} size={230} backgroundColor="#FFFFFF" color="#000000" />
              </View>
            ) : <AppText color="textSecondary" style={{ textAlign: "center" }}>The QR is hidden while the session is paused.</AppText>}
            {!!error && <AppText variant="caption" color="error">{error}</AppText>}
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {s.session.status === "ACTIVE"
                ? <Button label="Pause" variant="secondary" onPress={() => act("pause")} loading={busy} style={{ flex: 1 }} />
                : <Button label="Resume" onPress={() => act("resume")} loading={busy} style={{ flex: 1 }} />}
              <Button label="End" variant="danger" onPress={confirmEnd} disabled={busy} style={{ flex: 1 }} />
            </View>
            <AppText variant="heading">Recent activity</AppText>
            {s.recent.length === 0 ? <AppText color="textSecondary">No one has scanned yet.</AppText> : (
              <Card>{s.recent.map((r, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText>{r.name}</AppText><AppText variant="mono" color="textSecondary">{formatDateTime(r.at)}</AppText>
                </View>
              ))}</Card>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
