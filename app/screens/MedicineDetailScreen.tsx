import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine } from '../models/Medicine';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MedicineDetailScreen = ({ route, navigation }) => {
  const { medicineId } = route.params;
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  
  // Load medicine details
  useEffect(() => {
    loadMedicine();
  }, [medicineId]);
  
  const loadMedicine = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@medicines');
      const medicines: Medicine[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      const foundMedicine = medicines.find(med => med.id === medicineId);
      
      if (foundMedicine) {
        setMedicine(foundMedicine);
      } else {
        Alert.alert('Error', 'Medicine not found');
        navigation.goBack();
      }
    } catch (e) {
      console.error('Failed to load medicine details', e);
      Alert.alert('Error', 'Failed to load medicine details');
    }
  };

  // Delete medicine with confirmation
  const deleteMedicine = async () => {
    Alert.alert(
      "Delete Medicine",
      "Are you sure you want to delete this medicine?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: confirmDelete 
        }
      ]
    );
  };
  
  // Confirm delete medicine
  const confirmDelete = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@medicines');
      const medicines: Medicine[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      
      const updatedMedicines = medicines.filter(med => med.id !== medicineId);
      await AsyncStorage.setItem('@medicines', JSON.stringify(updatedMedicines));
      
      navigation.goBack();
    } catch (e) {
      console.error('Failed to delete medicine', e);
      Alert.alert('Error', 'Failed to delete the medicine');
    }
  };
  
  // Format time in 12-hour format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  
  // Format days of week
  const formatDaysOfWeek = () => {
    if (!medicine?.daysOfWeek) return "Every day";
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDays = days.filter((_, index) => medicine.daysOfWeek?.[index]);
    
    return selectedDays.join(', ');
  };

  // Format dosage display
  const formatDosage = (dosage: number) => {
    if (Number.isInteger(dosage)) {
      return dosage.toString();
    }
    return dosage.toFixed(1);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Navigate to edit screen
  const editMedicine = () => {
    navigation.navigate('AddMedicine', { 
      medicineId: medicineId,
      isEditing: true,
      medicine: medicine 
    });
  };
  
  if (!medicine) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View 
          style={[
            styles.colorIndicator, 
            { backgroundColor: medicine.color || '#4263eb' }
          ]} 
        />
        <Text style={styles.medicineName}>{medicine.name}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        {medicine.cyclicDosage ? (
          // Cyclic dosage information
          <View>
            <Text style={styles.sectionTitle}>Cyclic Dosage Pattern:</Text>
            <View style={styles.dosageTable}>
              <View style={styles.cyclicPatternRow}>
                <Text style={styles.cyclicPatternLabel}>Pattern:</Text>
                <Text style={styles.cyclicPatternValue}>
                  {medicine.cyclicDosage.sequence.map(dose => formatDosage(dose)).join(' → ')}
                </Text>
              </View>
              <View style={styles.cyclicPatternRow}>
                <Text style={styles.cyclicPatternLabel}>Start Date:</Text>
                <Text style={styles.cyclicPatternValue}>
                  {formatDate(medicine.cyclicDosage.startDate)}
                </Text>
              </View>
              <View style={styles.cyclicPatternRow}>
                <Text style={styles.cyclicPatternLabel}>Current Position:</Text>
                <Text style={styles.cyclicPatternValue}>
                  {medicine.cyclicDosage.currentPosition !== undefined 
                    ? (medicine.cyclicDosage.currentPosition + 1) 
                    : 1}
                </Text>
              </View>
            </View>
          </View>
        ) : medicine.dailyDosages ? (
          // Variable dosage by day
          <View>
            <Text style={styles.sectionTitle}>Daily Dosages:</Text>
            <View style={styles.dosageTable}>
              {DAYS_OF_WEEK.map((day, index) => {
                const dayDosage = medicine.dailyDosages?.find(d => d.day === index)?.dosage || medicine.dosage;
                
                return (
                  <View key={index} style={styles.dosageRow}>
                    <Text style={styles.dayName}>{day}</Text>
                    <Text style={styles.dosageValue}>
                      {formatDosage(dayDosage)} {dayDosage === 1 ? 'unit' : 'units'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          // Standard dosage
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dosage:</Text>
            <Text style={styles.infoValue}>
              {formatDosage(medicine.dosage)} {medicine.dosage === 1 ? 'unit' : 'units'}
            </Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Frequency:</Text>
          <Text style={styles.infoValue}>
            {medicine.frequency === 'daily' ? 'Daily' : 'Custom'}
          </Text>
        </View>
        
        {medicine.frequency === 'custom' && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Days:</Text>
            <Text style={styles.infoValue}>{formatDaysOfWeek()}</Text>
          </View>
        )}
        
        <View style={styles.timesContainer}>
          <Text style={styles.timesHeader}>Scheduled Times:</Text>
          {medicine.times.map((time, index) => (
            <View key={index} style={styles.timeItem}>
              <Text style={styles.timeText}>{formatTime(time.time)}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={editMedicine}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={deleteMedicine}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6'
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12
  },
  medicineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40'
  },
  infoContainer: {
    padding: 16
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  infoLabel: {
    width: 100,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057'
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: '#343a40'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 12
  },
  dosageTable: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  dosageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5'
  },
  cyclicPatternRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5'
  },
  cyclicPatternLabel: {
    width: 120,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057'
  },
  cyclicPatternValue: {
    flex: 1,
    fontSize: 16,
    color: '#343a40'
  },
  dayName: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500'
  },
  dosageValue: {
    fontSize: 16,
    color: '#343a40',
    fontWeight: 'bold'
  },
  timesContainer: {
    marginTop: 16
  },
  timesHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8
  },
  timeItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  timeText: {
    fontSize: 16,
    color: '#343a40'
  },
  actionsContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  editButton: {
    flex: 1,
    backgroundColor: '#4263eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#f03e3e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default MedicineDetailScreen; 