import { Tabs } from "expo-router";
import { CalendarCheck, Compass, Home, ScanLine, User } from "lucide-react-native";
import { tabScreenOptions } from "@/navigation/tabScreenOptions";

export default function ParticipantTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="hackathons" options={{ title: "Hackathons", tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }} />
      <Tabs.Screen name="my-events" options={{ title: "My Events", tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size} /> }} />
      <Tabs.Screen name="attendance" options={{ title: "Attendance", tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
