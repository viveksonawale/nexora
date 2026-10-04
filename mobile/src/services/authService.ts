import { authApi } from "@/api/authApi";
import { tokenStorage } from "./tokenStorage";
import type { AuthResult, Role, User } from "@/types/api";

async function persist(r: AuthResult): Promise<User> {
  await tokenStorage.set(r.token);
  return r.user;
}

export const authService = {
  login: async (email: string, password: string) => persist(await authApi.login(email.trim(), password)),
  verifyOtp: async (email: string, code: string) => persist(await authApi.verifyOtp(email, code)),
  signup: (b: { name: string; email: string; password: string; college: string; role: Role }) =>
    authApi.signup({ ...b, email: b.email.trim(), name: b.name.trim(), college: b.college.trim() }),
  /** Returns the signed-in user for a stored token, or null when there is none. */
  restore: async (): Promise<User | null> => {
    if (!(await tokenStorage.get())) return null;
    return (await authApi.me()).user;
  },
  logout: () => tokenStorage.clear(),
};
