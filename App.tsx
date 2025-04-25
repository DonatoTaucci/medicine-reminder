import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './app/screens/HomeScreen';
import AddMedicineScreen from './app/screens/AddMedicineScreen';
import MedicineDetailScreen from './app/screens/MedicineDetailScreen';
import MedicineHistoryScreen from './app/screens/MedicineHistoryScreen';
import NotificationService from './app/services/NotificationService';
import { Medicine } from './app/models/Medicine';

// Define route params types
type RootStackParamList = {
  Home: undefined;
  AddMedicine: { isEditing?: boolean; medicine?: Medicine; medicineId?: string } | undefined;
  MedicineDetail: { medicineId: string };
  MedicineHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Initialize notifications when app loads
  useEffect(() => {
    const setupNotifications = async () => {
      // Request permissions
      const permissionsGranted = await NotificationService.requestPermissions();
      
      if (permissionsGranted) {
        // Schedule all medicine notifications
        await NotificationService.scheduleAllMedicationNotifications();
        
        // Setup midnight reset for daily to-do list
        await NotificationService.setupMidnightReset();
      }
    };
    
    setupNotifications();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: true,
          headerTitleStyle: {
            fontSize: 20
          }
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Medicine Reminder' }} 
        />
        <Stack.Screen 
          name="AddMedicine" 
          component={AddMedicineScreen} 
          options={({ route }) => ({ 
            title: route.params?.isEditing ? 'Edit Medicine' : 'Add Medicine' 
          })} 
        />
        <Stack.Screen 
          name="MedicineDetail" 
          component={MedicineDetailScreen} 
          options={{ title: 'Medicine Details' }} 
        />
        <Stack.Screen 
          name="MedicineHistory" 
          component={MedicineHistoryScreen} 
          options={{ title: 'Medicine History' }} 
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
} 