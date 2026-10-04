import { View } from "react-native";
import { useRouter } from "expo-router";
import { Lock } from "lucide-react-native";
import { colors, space } from "@/theme";
import { Button } from "./Button";
import { EmptyState } from "./states";

export function SignInPrompt({ message }: { message: string }) {
  const router = useRouter();
  return (
    <EmptyState
      icon={<Lock size={30} color={colors.cyan} />}
      title="Sign in to continue"
      message={message}
      action={
        <View style={{ gap: space.sm, alignSelf: "stretch" }}>
          <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
          <Button label="Create account" variant="secondary" onPress={() => router.push("/(auth)/signup")} />
        </View>
      }
    />
  );
}
