# Nexora Mobile (Android)

React Native + TypeScript + Expo app. It is a second client for the **same Nexora backend** as the website: same database, same accounts, same data. It does not touch the Next.js site.

## Requirements
- Node 20 or newer, npm 10+
- Android Studio (emulator) or an Android phone with the **Expo Go** app / a dev build
- The Nexora API running (see `../backend/INSTALL.md`)

## Setup
```bash
cd mobile
npm install
npx expo install --fix     # aligns native package versions with the installed Expo SDK
cp .env.example .env       # then set EXPO_PUBLIC_API_URL
npx expo start
```
Press `a` to open on an Android emulator, or run `npx expo start --android`.

### Environment variables (`.env`)
| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | API base, e.g. `http://10.0.2.2:3000/api/v1` (emulator) or `http://<PC-LAN-IP>:3000/api/v1` (phone) |
| `EXPO_PUBLIC_WEB_URL` | Website URL, used for the About page link |

`EXPO_PUBLIC_*` values are bundled into the app, so never put secrets in them. Restart `expo start -c` after changing `.env`.

### Physical phone
Phone and PC must be on the same Wi-Fi. Start the website with `npx next dev -H 0.0.0.0`, use your PC's LAN IP in `EXPO_PUBLIC_API_URL`, and allow port 3000 through the firewall. Scan the Expo QR code with Expo Go.

### Build an APK / AAB
```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview      # APK for testing
eas build -p android --profile production   # AAB for Play Store
```
Release builds require an **https** API URL. Add app icons/splash images in `assets/` and reference them in `app.json` before publishing.

## Project structure
```
app/                 Expo Router routes (thin: compose components + hooks)
  _layout.tsx        fonts, providers, role-based route gate
  (auth)/            login, signup, otp, forgot-password
  (participant)/     tabs: home, hackathons, my-events, attendance, profile
  (organizer)/       tabs: dashboard, events, attendance, profile
  (judge)/           tabs: projects, history, profile
  hackathon/[id]  submit/[id]  ai-summary  about          shared stack screens
  event/[id]  create-event  attendance-control/[id]       organizer stack screens
  evaluate/[id]                                           judge stack screen
src/
  api/        one file per backend area; client.ts is the only place that calls fetch
  services/   logic around the API (token storage, auth flow, QR parsing)
  hooks/      useAsync (loading/error/refresh/polling), useHackathons, useNetwork, ...
  context/    AuthContext (session state)
  components/ reusable UI (Button, Input, OTPInput, HackathonCard, states, ...)
  screens/    screens shared by several routes (ProfileScreen)
  navigation/ shared tab bar options
  theme/      colors, typography, spacing tokens
  types/      API types      utils/  formatting, validation      constants/  filter lists
```
Data flow: **Screen → components/hooks → services/api → Nexora API → database**. UI files never call `fetch` directly.

## Navigation
Guests can browse hackathons (participant tabs) but registering, attendance and profile ask them to sign in. After sign in the root gate (`app/_layout.tsx`) sends each user to their role group and blocks the other two. Android back button works through Expo Router's stack.

| Role | Tabs |
|---|---|
| Participant | Home, Hackathons, My Events, Attendance, Profile |
| Organizer | Dashboard, Events, Attendance, Profile (event management, judges, results via Events) |
| Judge | Projects, History, Profile (evaluate opens from a project) |

## API architecture
`src/api/client.ts` adds the bearer token, a 15 s timeout, and uniform `ApiError(status, message, code)`. A 401 clears the session. Offline/unreachable errors surface as `code: "NETWORK"` and show an offline state with Retry.

## Authentication architecture
Email + password, email OTP verification, forgot/reset password, all against `/api/v1/auth/*`. The JWT is stored with `expo-secure-store` (Android Keystore), never AsyncStorage. `AuthContext` restores the session on launch via `GET /auth/me`. Google sign-in is **not** implemented.

## How to add things
- **Screen:** create `app/<name>.tsx` (stack) or add a file in a role folder plus a `Tabs.Screen` in that folder's `_layout.tsx` (tab).
- **API endpoint:** add the function to the matching `src/api/*Api.ts` using `request()`, add types to `src/types/api.ts`, then call it through a hook (`useAsync(() => yourApi.fn(), [deps])`).
- **Component:** add `src/components/Name.tsx`, use tokens from `@/theme` (no hardcoded colors), export it from `src/components/index.ts`.

## Not built (the website has no real version of these yet)
Teams, announcements, push notifications, offline caching, deep links beyond the `nexora://` scheme, light theme (the brief specifies dark), Google sign-in.
