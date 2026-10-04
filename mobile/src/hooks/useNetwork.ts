import { useNetInfo } from "@react-native-community/netinfo";

export function useNetwork() {
  const s = useNetInfo();
  return { isOffline: s.isConnected === false || s.isInternetReachable === false };
}
