import { Tabs } from "expo-router";
import { Gavel, History, User } from "lucide-react-native";
import { tabScreenOptions } from "@/navigation/tabScreenOptions";

export default function JudgeTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: ({ color, size }) => <Gavel color={color} size={size} /> }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
