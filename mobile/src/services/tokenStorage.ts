import * as SecureStore from "expo-secure-store";

const KEY = "nexora.token";
// Tokens live in the Android Keystore via SecureStore, never in AsyncStorage.
export const tokenStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (t: string) => SecureStore.setItemAsync(KEY, t),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
