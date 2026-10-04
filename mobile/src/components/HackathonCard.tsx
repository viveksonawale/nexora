import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, MapPin, Trophy, Users } from "lucide-react-native";
import { colors, space } from "@/theme";
import type { Hackathon } from "@/types/api";
import { formatDate, formatPrize, modeLabel } from "@/utils/format";
import { AppText } from "./AppText";
import { AvatarStack } from "./Avatar";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

function Meta({ icon, text, mono }: { icon: React.ReactNode; text: string; mono?: boolean }) {
  return (
    <View style={styles.meta}>
      {icon}
      <AppText variant={mono ? "mono" : "caption"} color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>{text}</AppText>
    </View>
  );
}

export function HackathonCard({ item, onPress }: { item: Hackathon; onPress?: () => void }) {
  const router = useRouter();
  const ic = { size: 14, color: colors.textMuted };
  return (
    <Card onPress={onPress ?? (() => router.push({ pathname: "/hackathon/[id]", params: { id: item.id } }))} selected={item.status === "LIVE"}>
      <View style={styles.top}>
        <StatusBadge status={item.status} />
        <AppText variant="caption" color="textMuted">{modeLabel[item.mode]}</AppText>
      </View>
      <AppText variant="heading" numberOfLines={2}>{item.name}</AppText>
      {!!item.college && <AppText variant="caption" color="textSecondary">{item.college}</AppText>}
      {!!item.theme && <AppText variant="body" color="textSecondary" numberOfLines={1}>{item.theme}</AppText>}
      <View style={styles.metaRow}>
        <Meta icon={<Calendar {...ic} />} text={formatDate(item.startDate)} />
        {!!item.location && <Meta icon={<MapPin {...ic} />} text={item.location} />}
        <Meta icon={<Trophy {...ic} />} text={formatPrize(item.prize, item.currency)} mono />
      </View>
      {item.tags.length > 0 && (
        <View style={styles.tags}>
          {item.tags.slice(0, 4).map((t) => (
            <View key={t} style={styles.tag}><AppText variant="caption" color="textSecondary">{t}</AppText></View>
          ))}
        </View>
      )}
      <View style={styles.foot}>
        <AvatarStack names={item.participantPreview} total={item.participantCount} />
        <Meta icon={<Users {...ic} />} text={`${item.participantCount} registered`} />
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", columnGap: space.lg, rowGap: 6, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.xs },
});
