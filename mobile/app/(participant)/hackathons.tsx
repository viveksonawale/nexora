import { useEffect, useState } from "react";
import { FlatList, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SearchX, Search } from "lucide-react-native";
import { AppText, Chip, EmptyState, ErrorState, HackathonCard, LoadingState, Screen, ScreenHeader } from "@/components";
import { FILTERS, SORTS } from "@/constants/filters";
import { useDebounce } from "@/hooks/useDebounce";
import { useHackathons } from "@/hooks/useHackathons";
import { colors, fonts, radius, space } from "@/theme";
import type { HackathonFilter, HackathonSort } from "@/types/api";

export default function HackathonsScreen() {
  const params = useLocalSearchParams<{ filter?: HackathonFilter }>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HackathonFilter>(params.filter ?? "all");
  const [sort, setSort] = useState<HackathonSort>("date");
  useEffect(() => { if (params.filter) setFilter(params.filter); }, [params.filter]);
  const q = useDebounce(search.trim());
  const { data, error, loading, refreshing, refresh, reload } = useHackathons({ q, filter, sort });

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.head}>
        <ScreenHeader title="Hackathons" subtitle="Search by name, college, location or tag." />
        <View style={styles.search}>
          <Search size={18} color={colors.textMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search hackathons" placeholderTextColor={colors.textMuted} selectionColor={colors.cyan} style={styles.input} returnKeyType="search" autoCapitalize="none" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />)}
        </ScrollView>
        <View style={styles.sortRow}>
          <AppText variant="caption" color="textMuted">Sort by</AppText>
          {SORTS.map((s) => <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />)}
        </View>
      </View>

      {loading ? <LoadingState /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(h) => h.id}
          renderItem={({ item }) => <HackathonCard item={item} />}
          contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
          refreshing={refreshing}
          onRefresh={refresh}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState icon={<SearchX size={30} color={colors.textMuted} />} title="No hackathons found" message="Try a different search or clear the filters." />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md },
  search: { flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md },
  input: { flex: 1, minHeight: 46, color: colors.text, fontFamily: fonts.body, fontSize: 15 },
  chips: { gap: space.sm, paddingRight: space.lg },
  sortRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
});
