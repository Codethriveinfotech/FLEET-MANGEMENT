# Vehicle Tracking App — Android Frontend

Complete Kotlin + Jetpack Compose frontend for the Vehicle Tracking App,
built for Android Studio (Ladybug/2024.2+ or newer, referred to as
"Android Studio 2026" in the brief). The backend is not included — the
app uses a **Room Database** for persistence, seeded with dummy data, 
so the whole app is fully clickable and demoable today. Swap
`AppRepository`'s function bodies for real API calls when the
backend is ready; no UI code needs to change.

## What's included

- **Splash screen** — animated logo intro using the supplied Vehicle App logo.
- **Driver Login** — with English / Tamil / Hindi language switcher (top
  left) and an Admin Login shortcut icon (top right). Switching language
  re-renders the entire app via Android's resource/locale system, not just
  a handful of strings.
- **Driver Sign Up** — name, phone, license number, password, photo
  upload (camera or gallery).
- **Driver Dashboard** (bottom navigation, 4 tabs):
  - Profile — edit info, capture photo with camera
  - Vehicle Details — upload vehicle photo, edit vehicle info
  - Trip Details — start/end time & KM. **Entries autosave to the local
    database as you type.** If the driver logs out before
    pressing Submit, the draft is still there next login. Submit is the
    only action that "sends" the trip to the admin.
  - Maintenance — upload bill photo (camera/gallery), description, date, cost
- **Admin Login** — separate secure login (dummy credentials below).
- **Admin Dashboard** (chip-tab navigation):
  - Admin Profile
  - Driver Management — add / edit / delete drivers
  - Vehicle Management — add / edit / delete vehicles
  - Vehicle List — tap a vehicle to see its full detail: vehicle info,
    assigned driver, maintenance history, bills, service records
  - Reports — grouped by Today / Yesterday / This Week / This Month,
    with filter chips for Date / Driver / Vehicle / Status, plus an
    "Export as Excel" action (wired to a placeholder — hook up to a real
    XLSX generator or backend export endpoint later)
- **Design**: Material 3, dark glassmorphism cards, brand gradient
  (blue → purple → pink) buttons, the supplied app logo used as the
  launcher icon and splash art.

## Dummy login credentials (for demoing without a backend)

- **Driver:** Name `Sohith`, Phone `9876543210`, Password `1234`
  (or Name `Dimpal`, Phone `9876500000`, Password `1234`)
- **Admin:** Username `admin`, Password `admin123`
- Or just use **Sign Up** to create a brand-new driver account.

## Project structure

```
VehicleTrackingApp-main/
├── app/
│   ├── src/main/
│   │   ├── java/com/vehicletrackingapp/
│   │   │   ├── MainActivity.kt
│   │   │   ├── VehicleTrackingApp.kt        (Application class)
│   │   │   ├── navigation/NavGraph.kt        (all screen routes)
│   │   │   ├── data/model/Models.kt          (Driver, Vehicle, Trip, Maintenance)
│   │   │   ├── data/local/AppDatabase.kt     (Room Database persistence)
│   │   │   ├── data/repo/AppRepository.kt    (Repository layer managing Room DB)
│   │   │   ├── util/LocaleHelper.kt          (runtime language switching)
│   │   │   ├── ui/theme/                     (colors, type, Material3 theme)
│   │   │   ├── ui/screens/                   (Splash, DriverLogin, SignUp, AdminLogin)
│   │   │   ├── ui/screens/driver/            (Driver dashboard + 4 tabs)
│   │   │   ├── ui/screens/admin/             (Admin dashboard + 5 tabs)
│   │   │   └── ui/screens/common/            (shared buttons, cards, text fields)
│   │   ├── res/values/ , values-ta/ , values-hi/   (EN / TA / HI strings)
│   │   ├── res/drawable/logo.png             (supplied logo)
│   │   ├── res/mipmap-*/                     (launcher icon, generated from logo)
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── gradle/wrapper/gradle-wrapper.properties
```

## How to open & run

1. **Unzip** the project anywhere on your machine.
2. Open **Android Studio** → `File > Open` → select the unzipped
   `VehicleTrackingApp-main` folder.
3. Let Gradle sync.
4. **Run the Backend**:
   - In Android Studio, find the **backend** configuration in the Run configurations dropdown (next to the Run button).
   - Select **backend [run]** and click **Run ▶**.
   - Ensure you have set the `DATABASE_URL` environment variable if connecting to Neon.
5. **Run the App**:
   - Select the **app** configuration.
   - Click **Run ▶** (or `Shift+F10`).

No API keys, signing configs, or backend URLs are required to run and
click through the whole app — it's fully self-contained with persistent local storage.

## Wiring up the real backend later

The UI interacts with the local **Room Database** via `AppRepository`. To
connect a real backend:

1. Add Retrofit/Ktor (or your client of choice) as a dependency.
2. Update `AppRepository` to sync the local Room data with your API.
3. Keep the function signatures in the Repository the same to ensure the UI remains unaffected.
4. The local database already handles draft persistence across app restarts.

## Notes & next steps

- Camera/gallery pickers use `ActivityResultContracts` + a `FileProvider`
  (already configured in the manifest) — no extra setup needed.
- Export-as-Excel currently shows a confirmation message only; connect it
  to a real XLSX writer (e.g. Apache POI on a backend endpoint, or a
  local library) once the report data shape is finalized with the
  backend team.
- Add real authentication/session handling (tokens, secure storage) when
  the backend is ready — current login is a plain in-memory check meant
  for demoing the frontend only.
