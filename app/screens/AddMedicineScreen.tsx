import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Modal,
  Pressable,
  Button
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine, MedicineTime, DailyDosage, CyclicDosage } from '../models/Medicine';
import uuid from 'react-native-uuid';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#4263eb', '#f03e3e', '#40c057', '#fd7e14', '#7950f2', '#1098ad'];

const AddMedicineScreen = ({ route, navigation }) => {
  // Check if we're editing a medicine
  const { isEditing, medicine: existingMedicine, medicineId } = route.params || {};
  
  const [name, setName] = useState(existingMedicine ? existingMedicine.name : '');
  const [frequency, setFrequency] = useState<'daily' | 'custom'>(
    existingMedicine ? existingMedicine.frequency : 'daily'
  );
  const [selectedDays, setSelectedDays] = useState<boolean[]>(
    existingMedicine && existingMedicine.daysOfWeek 
      ? existingMedicine.daysOfWeek 
      : [true, true, true, true, true, true, true]
  );
  const [times, setTimes] = useState<MedicineTime[]>(
    existingMedicine && existingMedicine.times 
      ? [...existingMedicine.times] 
      : [{ time: '09:00', taken: false, delayedTime: undefined }]
  );
  const [dosage, setDosage] = useState(
    existingMedicine ? existingMedicine.dosage.toString() : '1'
  );
  const [selectedColor, setSelectedColor] = useState(
    existingMedicine && existingMedicine.color 
      ? existingMedicine.color 
      : COLORS[0]
  );
  
  // State per i dosaggi variabili
  const [dosageType, setDosageType] = useState<'fixed' | 'daily' | 'cyclic'>(
    existingMedicine && existingMedicine.cyclicDosage 
      ? 'cyclic' 
      : existingMedicine && existingMedicine.dailyDosages 
        ? 'daily' 
        : 'fixed'
  );
  
  // Dosaggio per giorno della settimana
  const [dailyDosages, setDailyDosages] = useState<DailyDosage[]>(
    existingMedicine && existingMedicine.dailyDosages 
      ? [...existingMedicine.dailyDosages] 
      : [
          { day: 0, dosage: 1 }, // Domenica
          { day: 1, dosage: 1 }, // Lunedì
          { day: 2, dosage: 1 }, // Martedì
          { day: 3, dosage: 1 }, // Mercoledì
          { day: 4, dosage: 1 }, // Giovedì
          { day: 5, dosage: 1 }, // Venerdì
          { day: 6, dosage: 1 }, // Sabato
        ]
  );
  
  // Dosaggio ciclico
  const initialCyclicSequence = existingMedicine && existingMedicine.cyclicDosage 
    ? existingMedicine.cyclicDosage.sequence.map(n => n.toString())
    : ['1'];
  
  const [cyclicSequence, setCyclicSequence] = useState<string[]>(initialCyclicSequence);
  const [newDosageValue, setNewDosageValue] = useState('');
  
  // State per il time picker
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeIndex, setActiveTimeIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [cyclicStartDate, setCyclicStartDate] = useState(
    existingMedicine && existingMedicine.cyclicDosage && existingMedicine.cyclicDosage.startDate
      ? new Date(existingMedicine.cyclicDosage.startDate)
      : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  // Toggle a day selection (for custom frequency)
  const toggleDay = (index: number) => {
    const newSelectedDays = [...selectedDays];
    newSelectedDays[index] = !newSelectedDays[index];
    setSelectedDays(newSelectedDays);
  };

  // Update dosage for a specific day
  const updateDailyDosage = (dayIndex: number, newDosage: string) => {
    const numericDosage = parseFloat(newDosage) || 0;
    const updatedDosages = [...dailyDosages];
    updatedDosages[dayIndex] = { day: dayIndex, dosage: numericDosage };
    setDailyDosages(updatedDosages);
  };
  
  // Add a dosage to the cyclic sequence
  const addCyclicDosage = () => {
    if (!newDosageValue.trim() || isNaN(parseFloat(newDosageValue)) || parseFloat(newDosageValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid dosage value');
      return;
    }
    
    setCyclicSequence([...cyclicSequence, newDosageValue]);
    setNewDosageValue('');
  };
  
  // Remove a dosage from the cyclic sequence
  const removeCyclicDosage = (index: number) => {
    if (cyclicSequence.length <= 1) {
      Alert.alert('Error', 'You need at least one dosage in the cycle');
      return;
    }
    
    const newSequence = [...cyclicSequence];
    newSequence.splice(index, 1);
    setCyclicSequence(newSequence);
  };
  
  // Move a dosage in the cyclic sequence
  const moveCyclicDosage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === cyclicSequence.length - 1)
    ) {
      return;
    }
    
    const newSequence = [...cyclicSequence];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newSequence[index], newSequence[swapIndex]] = [newSequence[swapIndex], newSequence[index]];
    setCyclicSequence(newSequence);
  };

  // Open time picker
  const openTimePicker = (index: number) => {
    // Parse current time
    const currentTime = times[index].time;
    const [hours, minutes] = currentTime.split(':').map(Number);
    
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    setTempTime(date);
    setActiveTimeIndex(index);
    setTimePickerVisible(true);
  };

  // Handle time selection
  const handleTimeConfirm = () => {
    // Format the selected time
    const formattedHour = selectedHour.toString().padStart(2, '0');
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    const formattedTime = `${formattedHour}:${formattedMinute}`;
    
    // Update the time at the active index
    const newTimes = [...times];
    newTimes[activeTimeIndex].time = formattedTime;
    setTimes(newTimes);
    
    // Close the picker
    setTimePickerVisible(false);
  };

  // Handle date change for cyclic start date
  const handleDateChange = (selectedDate?: Date) => {
    if (selectedDate) {
      setCyclicStartDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  // Save the medicine
  const saveMedicine = async () => {
    try {
      // Validate input
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter a medicine name');
        return;
      }

      if (frequency === 'custom' && !selectedDays.some(day => day)) {
        Alert.alert('Error', 'Please select at least one day of the week');
        return;
      }

      if (times.length === 0) {
        Alert.alert('Error', 'Please add at least one time');
        return;
      }

      if (dosageType === 'fixed' && (isNaN(parseFloat(dosage)) || parseFloat(dosage) <= 0)) {
        Alert.alert('Error', 'Please enter a valid dosage');
        return;
      }
      
      if (dosageType === 'cyclic' && cyclicSequence.length === 0) {
        Alert.alert('Error', 'Please add at least one dosage to the cycle');
        return;
      }

      // The times array is already in the correct format
      const medicineTimes: MedicineTime[] = times;
      
      // Create cyclic dosage if needed
      let cyclicDosage: CyclicDosage | undefined;
      if (dosageType === 'cyclic') {
        try {
          const sequence = cyclicSequence.map(d => parseFloat(d));
          
          if (sequence.length === 0) {
            throw new Error('Empty sequence');
          }
          
          // If editing, preserve the current position in the cycle
          const currentPosition = existingMedicine && 
                                  existingMedicine.cyclicDosage && 
                                  existingMedicine.cyclicDosage.currentPosition !== undefined 
            ? existingMedicine.cyclicDosage.currentPosition 
            : 0;
            
          cyclicDosage = {
            sequence,
            startDate: cyclicStartDate.toISOString(),
            currentPosition
          };
        } catch (error) {
          Alert.alert('Error', 'Please enter a valid cyclic sequence (e.g. 1,1,0.5)');
          return;
        }
      }

      // Create medicine object
      const updatedMedicine: Medicine = {
        id: isEditing ? medicineId : uuid.v4().toString(),
        name,
        color: selectedColor,
        frequency,
        daysOfWeek: frequency === 'custom' ? selectedDays : undefined,
        times: medicineTimes,
        dosage: parseFloat(dosage),
        dailyDosages: dosageType === 'daily' ? dailyDosages : undefined,
        cyclicDosage: dosageType === 'cyclic' ? cyclicDosage : undefined
      };

      // Get existing medicines from storage
      const jsonValue = await AsyncStorage.getItem('@medicines');
      const existingMedicines: Medicine[] = jsonValue != null ? JSON.parse(jsonValue) : [];

      // Update or add the medicine
      let updatedMedicines: Medicine[];
      
      if (isEditing) {
        // If editing, replace the existing medicine
        updatedMedicines = existingMedicines.map(med => 
          med.id === medicineId ? updatedMedicine : med
        );
      } else {
        // If adding new, append to the list
        updatedMedicines = [...existingMedicines, updatedMedicine];
      }

      // Save updated list to storage
      await AsyncStorage.setItem('@medicines', JSON.stringify(updatedMedicines));

      // Navigate back to previous screen
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save medicine', e);
      Alert.alert('Error', 'Failed to save the medicine');
    }
  };

  // Render time picker
  const renderTimePicker = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={timePickerVisible}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Time</Text>
            
            <View style={styles.timePickerContainer}>
              {/* Hour Picker */}
              <View style={styles.timePickerColumn}>
                {Array.from({ length: 24 }, (_, i) => (
                  <TouchableOpacity
                    key={`hour-${i}`}
                    style={[
                      styles.timePickerItem,
                      selectedHour === i && styles.selectedTimeItem
                    ]}
                    onPress={() => setSelectedHour(i)}
                  >
                    <Text style={[
                      styles.timePickerText,
                      selectedHour === i && styles.selectedTimeText
                    ]}>
                      {i.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.timeSeparator}>:</Text>
              
              {/* Minute Picker */}
              <View style={styles.timePickerColumn}>
                {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => (
                  <TouchableOpacity
                    key={`minute-${minute}`}
                    style={[
                      styles.timePickerItem,
                      selectedMinute === minute && styles.selectedTimeItem
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.timePickerText,
                      selectedMinute === minute && styles.selectedTimeText
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setTimePickerVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonConfirm]}
                onPress={handleTimeConfirm}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.screenTitle}>
          {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
        </Text>
        {/* Medicine Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Medicine Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter medicine name"
          />
        </View>

        {/* Color Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorContainer}>
            {COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        {/* Dosage Type Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Dosage Type</Text>
          <View style={styles.dosageTypeButtons}>
            <TouchableOpacity
              style={[
                styles.dosageTypeButton,
                dosageType === 'fixed' && styles.selectedDosageType
              ]}
              onPress={() => setDosageType('fixed')}
            >
              <Text style={[
                styles.dosageTypeText,
                dosageType === 'fixed' && styles.selectedDosageTypeText
              ]}>Fixed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.dosageTypeButton,
                dosageType === 'daily' && styles.selectedDosageType
              ]}
              onPress={() => setDosageType('daily')}
            >
              <Text style={[
                styles.dosageTypeText,
                dosageType === 'daily' && styles.selectedDosageTypeText
              ]}>Day-based</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.dosageTypeButton,
                dosageType === 'cyclic' && styles.selectedDosageType
              ]}
              onPress={() => setDosageType('cyclic')}
            >
              <Text style={[
                styles.dosageTypeText,
                dosageType === 'cyclic' && styles.selectedDosageTypeText
              ]}>Cyclic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Regular Dosage (if type is FIXED) */}
        {dosageType === 'fixed' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Dosage (number of pills/units)</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              keyboardType="numeric"
              placeholder="Enter dosage"
            />
          </View>
        )}
        
        {/* Daily Variable Dosage (if type is DAILY) */}
        {dosageType === 'daily' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Daily Dosages</Text>
            {DAYS_OF_WEEK.map((day, index) => (
              <View key={index} style={styles.dailyDosageRow}>
                <Text style={styles.dayLabel}>{day}</Text>
                <TextInput
                  style={styles.dosageInput}
                  value={dailyDosages[index].dosage.toString()}
                  onChangeText={(value) => updateDailyDosage(index, value)}
                  keyboardType="numeric"
                  placeholder="Dosage"
                />
                <Text style={styles.unitText}>units</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Cyclic Dosage (if type is CYCLIC) */}
        {dosageType === 'cyclic' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cyclic Dosage Pattern</Text>
            <Text style={styles.helpText}>
              Define a sequence of dosages that repeats continuously (e.g., 1 → 1.5 → 1 → 1.5...)
            </Text>
            
            {/* Current Sequence */}
            <View style={styles.cyclicSequenceContainer}>
              <Text style={styles.sequenceTitle}>Current Sequence:</Text>
              
              {cyclicSequence.map((dose, index) => (
                <View key={index} style={styles.sequenceItem}>
                  <Text style={styles.sequenceNumber}>{index + 1}</Text>
                  <Text style={styles.sequenceDosage}>{dose} {parseFloat(dose) === 1 ? 'unit' : 'units'}</Text>
                  
                  <View style={styles.sequenceActions}>
                    <TouchableOpacity
                      style={[styles.sequenceButton, index === 0 && styles.disabledButton]}
                      disabled={index === 0}
                      onPress={() => moveCyclicDosage(index, 'up')}
                    >
                      <Text style={styles.sequenceButtonText}>↑</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.sequenceButton, index === cyclicSequence.length - 1 && styles.disabledButton]}
                      disabled={index === cyclicSequence.length - 1}
                      onPress={() => moveCyclicDosage(index, 'down')}
                    >
                      <Text style={styles.sequenceButtonText}>↓</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.sequenceButton, styles.deleteButton]}
                      onPress={() => removeCyclicDosage(index)}
                    >
                      <Text style={styles.sequenceButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Add to Sequence */}
            <View style={styles.addToSequenceContainer}>
              <TextInput
                style={styles.sequenceInput}
                value={newDosageValue}
                onChangeText={setNewDosageValue}
                placeholder="Dosage"
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.addToSequenceButton}
                onPress={addCyclicDosage}
              >
                <Text style={styles.addToSequenceText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Frequency */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.frequencyContainer}>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                frequency === 'daily' && styles.selectedFrequency
              ]}
              onPress={() => setFrequency('daily')}
            >
              <Text style={[
                styles.frequencyText,
                frequency === 'daily' && styles.selectedFrequencyText
              ]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                frequency === 'custom' && styles.selectedFrequency
              ]}
              onPress={() => setFrequency('custom')}
            >
              <Text style={[
                styles.frequencyText,
                frequency === 'custom' && styles.selectedFrequencyText
              ]}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Days of Week (for custom frequency) */}
        {frequency === 'custom' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Days of Week</Text>
            <View style={styles.daysContainer}>
              {DAYS_OF_WEEK.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayOption,
                    selectedDays[index] && styles.selectedDay
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text style={[
                    styles.dayText,
                    selectedDays[index] && styles.selectedDayText
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Times */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Times</Text>
          {times.map((timeObj, index) => (
            <View key={index} style={styles.timeRow}>
              <TouchableOpacity 
                style={styles.timeInput}
                onPress={() => openTimePicker(index)}
              >
                <Text style={styles.timeInputText}>{timeObj.time}</Text>
              </TouchableOpacity>
              
              {times.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    const newTimes = [...times];
                    newTimes.splice(index, 1);
                    setTimes(newTimes);
                  }}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity 
            style={styles.addTimeButton}
            onPress={() => {
              setTimes([...times, { time: '09:00', taken: false, delayedTime: undefined }]);
            }}
          >
            <Text style={styles.addTimeButtonText}>+ Add Another Time</Text>
          </TouchableOpacity>
        </View>

        {/* Cyclic Start Date */}
        {dosageType === 'cyclic' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {cyclicStartDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showDatePicker && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Select Date</Text>
                
                <View style={styles.datePickerContainer}>
                  {/* Simple date selector with today and next few days */}
                  <TouchableOpacity
                    style={styles.datePickerItem}
                    onPress={() => {
                      const today = new Date();
                      handleDateChange(today);
                    }}
                  >
                    <Text style={styles.datePickerText}>Today</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.datePickerItem}
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      handleDateChange(tomorrow);
                    }}
                  >
                    <Text style={styles.datePickerText}>Tomorrow</Text>
                  </TouchableOpacity>
                  
                  {[2, 3, 4, 5, 6].map((daysAhead) => {
                    const date = new Date();
                    date.setDate(date.getDate() + daysAhead);
                    return (
                      <TouchableOpacity
                        key={daysAhead}
                        style={styles.datePickerItem}
                        onPress={() => handleDateChange(date)}
                      >
                        <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonCancel]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveMedicine}>
          <Text style={styles.saveButtonText}>Save Medicine</Text>
        </TouchableOpacity>
      </View>
      
      {/* Time Picker Modal */}
      {renderTimePicker()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  formContainer: {
    padding: 16
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40'
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 8
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#343a40'
  },
  dosageTypeButtons: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    overflow: 'hidden'
  },
  dosageTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedDosageType: {
    backgroundColor: '#4263eb'
  },
  dosageTypeText: {
    fontWeight: 'bold',
    color: '#495057'
  },
  selectedDosageTypeText: {
    color: 'white'
  },
  helpText: {
    color: '#6c757d',
    marginBottom: 12,
    fontSize: 14
  },
  cyclicSequenceContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12
  },
  sequenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057'
  },
  sequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5'
  },
  sequenceNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057'
  },
  sequenceDosage: {
    flex: 1,
    fontSize: 16,
    color: '#343a40'
  },
  sequenceActions: {
    flexDirection: 'row'
  },
  sequenceButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: 15,
    marginLeft: 5
  },
  disabledButton: {
    opacity: 0.5
  },
  deleteButton: {
    backgroundColor: '#f03e3e'
  },
  sequenceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057'
  },
  addToSequenceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sequenceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    marginRight: 8
  },
  addToSequenceButton: {
    backgroundColor: '#4263eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addToSequenceText: {
    color: 'white',
    fontWeight: 'bold'
  },
  frequencyContainer: {
    flexDirection: 'row'
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  selectedFrequency: {
    backgroundColor: '#4263eb',
    borderColor: '#4263eb'
  },
  frequencyText: {
    fontWeight: 'bold',
    color: '#343a40'
  },
  selectedFrequencyText: {
    color: 'white'
  },
  dailyDosageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  dayLabel: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40'
  },
  dosageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 8,
    backgroundColor: 'white'
  },
  unitText: {
    width: 40,
    fontSize: 14,
    color: '#6c757d'
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  dayOption: {
    width: '13%',
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginBottom: 8
  },
  selectedDay: {
    backgroundColor: '#4263eb',
    borderColor: '#4263eb'
  },
  dayText: {
    color: '#343a40'
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold'
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  timeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'white'
  },
  timeInputText: {
    fontSize: 16,
    color: '#212529'
  },
  removeButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#f03e3e',
    borderRadius: 8
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  addTimeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4263eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8
  },
  addTimeButtonText: {
    color: '#4263eb',
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: '#4263eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 200,
    marginVertical: 10
  },
  timePickerColumn: {
    height: 200,
    width: 60,
    overflow: 'scroll'
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 10
  },
  timePickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedTimeItem: {
    backgroundColor: '#e7f5ff',
    borderRadius: 8
  },
  timePickerText: {
    fontSize: 20
  },
  selectedTimeText: {
    fontWeight: 'bold',
    color: '#4263eb'
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    elevation: 2,
    alignItems: 'center'
  },
  buttonCancel: {
    backgroundColor: '#adb5bd'
  },
  buttonConfirm: {
    backgroundColor: '#4263eb'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white'
  },
  dateButtonText: {
    fontSize: 16,
    color: '#343a40'
  },
  datePickerContainer: {
    width: '100%',
    marginVertical: 15
  },
  datePickerItem: {
    width: '100%',
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 8
  },
  datePickerText: {
    fontSize: 16,
    color: '#343a40',
    textAlign: 'center'
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#343a40',
    textAlign: 'center'
  }
});

export default AddMedicineScreen; 