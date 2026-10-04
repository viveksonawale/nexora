import { Linking, View } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader } from "@/components";
import { WEB_URL } from "@/config/env";
import { space } from "@/theme";

// TODO: replace with the website's /about copy. The team list lives on the website and is not served by the API yet.
export default function AboutScreen() {
  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="About Nexora" back />
      <View style={{ gap: space.lg }}>
        <Card>
          <AppText variant="heading">What Nexora does</AppText>
          <AppText color="textSecondary">Nexora helps colleges and communities run hackathons end to end: discovery and registration, dynamic QR attendance, blind judging and event management.</AppText>
        </Card>
        {!!WEB_URL && <Button label="Meet the team on the website" variant="secondary" onPress={() => Linking.openURL(`${WEB_URL}/about`)} />}
      </View>
    </Screen>
  );
}
