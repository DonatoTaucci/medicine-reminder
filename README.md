# Medicine Reminder App

A complete cross-platform mobile application (iOS and Android) that helps users manage their medications through smart reminders, customized dosages, and a simple daily activity list.

## 📱 Detailed Overview

Medicine Reminder is designed to solve one of the most common problems in health management: correctly and timely following prescribed medication regimens. The app offers a user-friendly interface to manage medications with complex dosages, variable schedules, and a history of administrations to monitor therapeutic adherence.

Unlike other similar apps, Medicine Reminder supports advanced dosage scenarios, such as:
- Fixed daily dosages
- Variable dosages based on the day of the week
- Cyclic dosages (sequences that repeat over time)

Each medication can be scheduled to be taken at specific times, with configurable notifications and the ability to postpone reminders when necessary.

## ✅ Implemented Features (Current Roadmap)

### Basic Medication Management
- **Detailed creation and modification of medications**:
  - Custom name and color for easy identification
  - Options for fixed, daily, or cyclic dosage
  - Frequency setting (daily or specific days)
  - Adding multiple times for each medication
  
- **Daily medication list**:
  - Display only medications to be taken today
  - Colored indication for delayed medications
  - Ability to mark medications as "taken"
  
- **Actions for scheduled medications**:
  - One-hour postponement for reminders
  - Reporting completed intake
  - Detailed information display
  
- **Advanced dosage management**:
  - Variable dosages by day of the week
  - Cyclic dosages with customizable sequences
  - Start date for cyclic dosages

### Notification System
- Automatic reminders at scheduled times
- Automatic reset at midnight for the daily list

### History and Monitoring
- **Dedicated chronological section**:
  - Date filter with day-by-day navigation
  - Calendar for precise year, month, and day selection
  - Display of taken and not taken medications

### User Interface
- Modern design with colored elements for easy identification
- Intuitive interface with clear organization of information
- Light mode support for maximum readability

## 🚀 Future Roadmap (Planned Features)

### Phase 1: Core Improvements (1-3 months)
- **Cloud synchronization**:
  - Automatic data backup to cloud
  - Synchronization between different devices
  - Facilitated data restoration

- **Adherence statistics**:
  - Dashboard with therapeutic adherence visualization
  - Weekly/monthly intake charts
  - Analysis of delay or non-intake patterns

- **UX improvements**:
  - Dark mode for nighttime use
  - Smoother animations
  - Interactive tutorial for new users

### Phase 2: Advanced Features (3-6 months)
- **Caregiver mode**:
  - Management of multiple profiles (family members/patients)
  - Remote monitoring system to verify intake
  - Notifications for caregivers when a medication is not taken
  
- **Integration with health services**:
  - Prescription scanning for automatic import
  - Renewal reminders for prescriptions
  - Connection with pharmacies for restocking
  
- **In-depth medication management**:
  - Medication database with detailed information
  - Alerts for drug interactions
  - Side effects recording

### Phase 3: Expansion and Publication (6-12 months)
- **Publication on app stores**:
  - Optimization for Google Play Store
  - Optimization for Apple App Store
  - Configuration of in-app purchases
  
- **Freemium plan**:
  - Free basic version
  - Premium subscription with advanced features
  - One-time purchases for specific functions
  
- **Localization**:
  - Multilingual support (IT, EN, ES, FR, DE)
  - Adaptation to local conventions for times/dosages
  - Support for different date and time formats

## 💡 Suggested Features to Implement

Based on best practices in health management and user feedback from similar apps, here are some high-value-added features:

1. **Medication barcode scanning**:
   - Automatic medication identification
   - Population of standard information such as name and dosage
   - Quick access to patient information leaflet

2. **Travel mode**:
   - Automatic adjustment to time zone changes
   - Reminders to prepare medications before travel
   - Special display for medications to be carried during travel

3. **Integration with wearable devices**:
   - Notifications on smartwatches
   - Intake tracking from wearable devices
   - Integration with health apps (Apple Health, Google Fit)

4. **Voice assistant**:
   - Voice commands to record intake
   - Customized audio reminders
   - Advanced accessibility features

5. **Community and social support**:
   - Shared reminders for family members
   - Badges and recognition for consistent adherence
   - Options to share progress with healthcare providers

## 🔧 Technical Setup

### Prerequisites
- Node.js LTS (v14 or newer)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medicine-reminder.git
cd medicine-reminder
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npx expo start
```

4. Follow Expo instructions to run on device or emulator.

### Generating an APK file for Android

To generate an APK file installable on Android devices:

1. Create an Expo account and log in from CLI:
```bash
npx expo login
```

2. Configure the app.json file with your app and Expo account information:
```json
{
  "expo": {
    "name": "Medicine Reminder",
    "slug": "medicine-reminder",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.yourcompany.medicinereminder",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "owner": "YOUR_EXPO_USERNAME",
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

3. Create and configure an eas.json file in the project root:
```json
{
  "cli": {
    "version": ">= 0.60.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

4. Initialize the project with EAS:
```bash
npx eas init
```

5. Start the Android build process:
```bash
npx eas build --platform android --profile preview
```

6. Follow the on-screen instructions. Upon completion of the build, EAS will provide a link to download the generated APK file.

### References to EAS account to modify

When passing the app to another developer or if you need to change your Expo account, you need to update the following references:

1. In the `app.json` file:
   - `"owner": "YOUR_EXPO_USERNAME"` - Replace "YOUR_EXPO_USERNAME" with your Expo username
   - `"extra": { "eas": { "projectId": "YOUR_PROJECT_ID" } }` - This will be automatically generated when you run `npx eas init` with the new account

2. Make sure to run `npx expo logout` followed by `npx expo login` to log in with the new account before running new builds.

### Alternative: Generating an APK locally

To generate an APK without using Expo's build services:

1. Run the command to export the Expo project to a standard React Native project:
```bash
npx expo eject
```

2. Navigate to the android directory:
```bash
cd android
```

3. Run the Gradle build command:
```bash
./gradlew assembleRelease
```

4. The generated APK will be found in: `android/app/build/outputs/apk/release/app-release.apk`

## 📊 Project Structure

```
medicine-reminder/
├── app/
│   ├── components/       # Reusable UI components
│   ├── models/           # TypeScript interfaces and data models
│   ├── screens/          # App screens
│   └── services/         # Business logic and services
├── assets/               # Images, fonts, etc.
├── App.tsx               # Main application component
└── package.json          # Project dependencies
```

## 📝 License

This project is licensed under the terms of the MIT License - see the LICENSE file for details.

## 📞 Contacts and Support

For support, suggestions, or collaborations, contact me at:
[donatotaucci@gmail.com]
