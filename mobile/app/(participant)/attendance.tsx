import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { CheckCircle2, QrCode, ScanLine, XCircle } from "lucide-react-native";
import { attendanceApi } from "@/api/attendanceApi";
import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader, SignInPrompt } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { parseAttendanceQr } from "@/services/attendanceService";
import { colors, radius, space } from "@/theme";

type Mode = "list" | "scan" | "busy" | "success" | "error";

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [perm, requestPerm] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>("list");
  const [message, setMessage] = useState("");
  const locked = useRef(false);
  const q = useAsync(() => attendanceApi.active(), [user?.id], { enabled: !!user, refetchOnFocus: true, intervalMs: 15000 });

  async function startScan() {
    const res = perm?.granted ? perm : await requestPerm();
    if (!res.granted) { setMessage("Camera access is needed to scan the attendance QR. Allow it in Android settings."); setMode("error"); return; }
    locked.current = false;
    setMode("scan");
  }

  async function onScanned({ data }: { data: string }) {
    if (locked.current) return; // one scan at a time
    locked.current = true;
    setMode("busy");
    const token = parseAttendanceQr(data);
    if (!token) { setMessage("This is not a Nexora attendance QR."); setMode("error"); return; }
    try {
      const r = await attendanceApi.mark(token);
      setMessage(r.hackathonName);
      setMode("success");
      q.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not mark attendance.");
      setMode("error");
    }
  }

  if (!user) return <Screen><ScreenHeader title="Attendance" /><SignInPrompt message="Sign in to mark attendance for your hackathons." /></Screen>;

  if (mode === "scan" || mode === "busy") {
    return (
      <Screen scroll={false} padded={false}>
        <View style={{ flex: 1 }}>
          <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={mode === "scan" ? onScanned : undefined} />
          <View style={styles.overlay} pointerEvents="box-none">
            <AppText variant="bodyStrong" style={styles.hint}>{mode === "busy" ? "Checking QR" : "Point at the organizer's QR code"}</AppText>
            <View style={styles.frame} />
            <Button label="Cancel" variant="secondary" onPress={() => setMode("list")} style={{ alignSelf: "center" }} />
          </View>
        </View>
      </Screen>
    );
  }

  if (mode === "success" || mode === "error") {
    const ok = mode === "success";
    return (
      <Screen>
        <View style={styles.result}>
          {ok ? <CheckCircle2 size={64} color={colors.success} /> : <XCircle size={64} color={colors.error} />}
          <AppText variant="title">{ok ? "Attendance marked" : "Could not mark attendance"}</AppText>
          <AppText color="textSecondary" style={{ textAlign: "center" }}>{message}</AppText>
          <View style={{ gap: space.sm, alignSelf: "stretch", marginTop: space.lg }}>
            {!ok && <Button label="Scan again" onPress={startScan} />}
            <Button label="Done" variant={ok ? "primary" : "secondary"} onPress={() => setMode("list")} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen refreshing={q.refreshing} onRefresh={q.refresh}>
      <ScreenHeader title="Attendance" subtitle="Active sessions for hackathons you registered in." />
      {q.loading ? <LoadingState /> : q.error && !q.data ? <ErrorState error={q.error} onRetry={q.reload} /> :
        q.data && q.data.items.length > 0 ? (
          <View style={{ gap: space.md }}>
            {q.data.items.map((s) => (
              <Card key={s.sessionId} selected={!s.alreadyMarked}>
                <AppText variant="heading">{s.hackathonName}</AppText>
                {s.alreadyMarked ? (
                  <View style={styles.row}><CheckCircle2 size={16} color={colors.success} /><AppText color="success">Attendance marked</AppText></View>
                ) : (
                  <>
                    <AppText color="textSecondary">Attendance is open. Scan the QR shown by the organizer.</AppText>
                    <Button label="Scan QR" icon={<ScanLine size={18} color={colors.onAccent} />} onPress={startScan} />
                  </>
                )}
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState icon={<QrCode size={30} color={colors.textMuted} />} title="No attendance session is open" message="When an organizer starts attendance for a hackathon you registered for, it appears here." />
        )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "space-between", padding: space.xl, backgroundColor: "rgba(5,10,18,0.35)" },
  hint: { backgroundColor: colors.surface, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, overflow: "hidden" },
  frame: { width: 240, height: 240, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.cyan },
  result: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, paddingVertical: space.xxl },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
});
