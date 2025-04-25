import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Todo from '../components/Todo';
import { Medicine } from '../models/Medicine';

// Define the HomeScreen component
const HomeScreen = ({ navigation }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayMedicines, setTodayMedicines] = useState<Medicine[]>([]);

  // Load medicines from storage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadMedicines();
      return () => {};
    }, [])
  );
  
  // Load medicines from AsyncStorage
  const loadMedicines = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@medicines');
      const loadedMedicines = jsonValue != null ? JSON.parse(jsonValue) : [];
      setMedicines(loadedMedicines);
      
      // Filter medicines for today's to-do list
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const todayItems = loadedMedicines.filter(med => {
        // Check if medicine should be taken today based on frequency
        if (med.frequency === 'daily') return true;
        if (med.frequency === 'custom' && med.daysOfWeek[dayOfWeek]) return true;
        return false;
      });
      
      setTodayMedicines(todayItems);
    } catch (e) {
      console.error('Failed to load medicines', e);
    }
  };

  // Mark medicine as taken/untaken
  const toggleMedicineTaken = async (id, timeIndex) => {
    const updatedMedicines = [...medicines];
    const medicineIndex = updatedMedicines.findIndex(med => med.id === id);
    
    if (medicineIndex !== -1) {
      // Toggle the taken status for the specific time
      const medicine = updatedMedicines[medicineIndex];
      const time = medicine.times[timeIndex];
      time.taken = !time.taken;
      
      // Record this action in history
      await recordMedicineHistory(medicine, timeIndex, time.taken, time.time);
      
      // Update state and storage
      setMedicines(updatedMedicines);
      updateTodayMedicines(updatedMedicines);
      await AsyncStorage.setItem('@medicines', JSON.stringify(updatedMedicines));
    }
  };

  // Record medicine action in history
  const recordMedicineHistory = async (medicine, timeIndex, taken, time, delayedTime?: string) => {
    try {
      // Get existing history
      const jsonValue = await AsyncStorage.getItem('@medicineHistory');
      const history = jsonValue != null ? JSON.parse(jsonValue) : [];
      
      // Create history record
      const historyRecord = {
        date: new Date().toISOString(),
        medicine: {
          id: medicine.id,
          name: medicine.name,
          color: medicine.color,
        },
        timeIndex,
        taken,
        time,
        actualTime: delayedTime || new Date().toISOString()
      };
      
      // Add to history and save
      history.push(historyRecord);
      await AsyncStorage.setItem('@medicineHistory', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to record medicine history', e);
    }
  };

  // Update today's medicines based on full medicine list
  const updateTodayMedicines = (allMedicines) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const todayItems = allMedicines.filter(med => {
      if (med.frequency === 'daily') return true;
      if (med.frequency === 'custom' && med.daysOfWeek[dayOfWeek]) return true;
      return false;
    });
    
    setTodayMedicines(todayItems);
  };

  // Handle reminder delay
  const handleReminderDelay = (medicine, timeIndex) => {
    Alert.alert(
      "Reminder Delay",
      "Do you want to delay this reminder only for today?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delay by 1 hour", 
          onPress: () => delayReminder(medicine.id, timeIndex, 60) 
        }
      ]
    );
  };

  // Delay the reminder for a specific medicine and time
  const delayReminder = async (id, timeIndex, minutesToDelay) => {
    const updatedMedicines = [...medicines];
    const medicineIndex = updatedMedicines.findIndex(med => med.id === id);
    
    if (medicineIndex !== -1) {
      const medicine = updatedMedicines[medicineIndex];
      const time = medicine.times[timeIndex];
      
      // Calculate the delayed time
      const delayedTime = new Date(new Date().getTime() + minutesToDelay * 60000);
      
      // Only modify today's reminder time (not the original schedule)
      time.delayedTime = delayedTime;
      
      // Record this delay in history
      await recordMedicineHistory(medicine, timeIndex, false, time.time, delayedTime.toISOString());
      
      // Update state and storage
      setMedicines(updatedMedicines);
      updateTodayMedicines(updatedMedicines);
      await AsyncStorage.setItem('@medicines', JSON.stringify(updatedMedicines));
    }
  };

  // Render each medicine item
  const renderMedicineItem = ({ item }) => {
    return (
      <Todo 
        medicine={item} 
        onToggle={toggleMedicineTaken}
        onDelay={handleReminderDelay}
        onPress={() => navigation.navigate('MedicineDetail', { medicineId: item.id })}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Medicines</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => navigation.navigate('MedicineHistory')}
          >
            <Text style={styles.buttonText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMedicine')}
          >
            <Text style={styles.buttonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {todayMedicines.length > 0 ? (
        <FlatList
          data={todayMedicines}
          renderItem={renderMedicineItem}
          keyExtractor={item => item.id}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No medicines scheduled for today</Text>
          <TouchableOpacity 
            style={styles.addMedicineButton}
            onPress={() => navigation.navigate('AddMedicine')}
          >
            <Text style={styles.addMedicineButtonText}>Add Medicine</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40'
  },
  headerButtons: {
    flexDirection: 'row',
  },
  historyButton: {
    backgroundColor: '#40c057',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  addButton: {
    backgroundColor: '#4263eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 16
  },
  addMedicineButton: {
    backgroundColor: '#4263eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  addMedicineButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default HomeScreen; 