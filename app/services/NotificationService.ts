import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine } from '../models/Medicine';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  // Request notification permissions
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  }
  
  // Schedule all medicine notifications
  static async scheduleAllMedicationNotifications() {
    try {
      // Cancel all existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Load medicines from storage
      const jsonValue = await AsyncStorage.getItem('@medicines');
      const medicines: Medicine[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      
      for (const medicine of medicines) {
        await this.scheduleMedicineNotifications(medicine);
      }
      
      console.log('All notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling all notifications:', error);
    }
  }
  
  // Schedule notifications for a specific medicine
  static async scheduleMedicineNotifications(medicine: Medicine) {
    try {
      const { id, name, times, frequency, daysOfWeek } = medicine;
      
      // For each time the medicine should be taken
      for (let i = 0; i < times.length; i++) {
        const timeObj = times[i];
        const [hours, minutes] = timeObj.time.split(':').map(Number);
        
        // Schedule notification for specific days or daily
        if (frequency === 'daily') {
          await this.scheduleNotification(
            id + '-' + i,
            name,
            hours,
            minutes,
            null // No specific day, will repeat daily
          );
        } else if (frequency === 'custom' && daysOfWeek) {
          // Schedule for each selected day of the week
          for (let day = 0; day < 7; day++) {
            if (daysOfWeek[day]) {
              await this.scheduleNotification(
                id + '-' + i + '-' + day,
                name,
                hours,
                minutes,
                day
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling medicine notifications:', error);
    }
  }
  
  // Schedule a single notification
  static async scheduleNotification(
    identifier: string,
    medicineName: string,
    hour: number,
    minute: number,
    weekDay: number | null
  ) {
    try {
      // Create trigger for the notification
      const trigger: any = {
        hour,
        minute,
        repeats: true,
      };
      
      // If weekDay is specified, add it to the trigger
      if (weekDay !== null) {
        trigger.weekday = weekDay + 1; // Expo uses 1-7 for days of week
      }
      
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medicine Reminder',
          body: `Time to take your ${medicineName}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
        identifier,
      });
      
      console.log(`Scheduled notification for ${medicineName} at ${hour}:${minute}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }
  
  // Cancel notifications for a specific medicine
  static async cancelMedicineNotifications(medicineId: string) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        // Check if the notification identifier starts with the medicine ID
        if (notification.identifier.startsWith(medicineId)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      console.log(`Cancelled all notifications for medicine ${medicineId}`);
    } catch (error) {
      console.error('Error cancelling medicine notifications:', error);
    }
  }
  
  // Reset all notifications at midnight
  static async setupMidnightReset() {
    // Calculate time until next midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set to next midnight
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    
    // Schedule a timeout to reset the notifications at midnight
    setTimeout(async () => {
      try {
        // Load medicines, reset 'taken' status, and update storage
        const jsonValue = await AsyncStorage.getItem('@medicines');
        const medicines: Medicine[] = jsonValue != null ? JSON.parse(jsonValue) : [];
        
        const updatedMedicines = medicines.map(medicine => {
          // Reset taken status for all times
          const updatedTimes = medicine.times.map(time => ({
            ...time,
            taken: false,
            delayedTime: undefined
          }));
          
          return {
            ...medicine,
            times: updatedTimes,
            delayedTime: undefined
          };
        });
        
        // Save updated medicines back to storage
        await AsyncStorage.setItem('@medicines', JSON.stringify(updatedMedicines));
        
        // Reschedule notifications
        await this.scheduleAllMedicationNotifications();
        
        // Setup next midnight reset
        this.setupMidnightReset();
      } catch (error) {
        console.error('Error during midnight reset:', error);
      }
    }, timeUntilMidnight);
    
    console.log(`Scheduled midnight reset in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
  }
}

export default NotificationService; 