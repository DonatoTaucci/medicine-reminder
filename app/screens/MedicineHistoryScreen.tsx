import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine, MedicineTime } from '../models/Medicine';
import { useFocusEffect } from '@react-navigation/native';

// Interface for history record
interface HistoryRecord {
  date: string; // ISO date string
  medicine: Medicine;
  timeIndex: number;
  taken: boolean;
  time: string; // Original scheduled time
  actualTime?: string; // Time when marked as taken or delayed
}

const MedicineHistoryScreen = ({ navigation }) => {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HistoryRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarPickerVisible, setCalendarPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Setup the header with calendar icon
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => showCalendarPicker()}
          style={styles.headerIconContainer}
        >
          <Text style={styles.headerCalendarIcon}>📅</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Function to show the calendar picker to ensure it works
  const showCalendarPicker = () => {
    console.log("Calendar picker button pressed");
    setCalendarPickerVisible(true);
  };

  // Load history every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
      return () => {};
    }, [])
  );

  // Filter records when selected date changes
  useEffect(() => {
    filterRecordsByDate(selectedDate);
  }, [selectedDate, historyRecords]);

  // Load history from storage
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const jsonValue = await AsyncStorage.getItem('@medicineHistory');
      const history: HistoryRecord[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      
      // Sort history by date (newest first)
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistoryRecords(history);
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to load history', e);
      Alert.alert('Error', 'Failed to load medicine history');
      setIsLoading(false);
    }
  };

  // Filter records by date
  const filterRecordsByDate = (date: Date) => {
    const dateString = date.toDateString();
    
    const filtered = historyRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() === dateString;
    });
    
    setFilteredRecords(filtered);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    if (timeString.includes('T')) {
      // This is a full date-time string
      const date = new Date(timeString);
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else {
      // This is just a time string like "08:30"
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    }
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  // Render date picker modal
  const renderDatePicker = () => {
    // Create an array of dates for the last 30 days
    const dates = Array.from({length: 30}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    });

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={datePickerVisible}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Date</Text>
            
            <ScrollView style={styles.datePickerContainer}>
              {dates.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.datePickerItem,
                    date.toDateString() === selectedDate.toDateString() && styles.selectedDateItem
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setDatePickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.datePickerText,
                    date.toDateString() === selectedDate.toDateString() && styles.selectedDateText
                  ]}>
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setDatePickerVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render a record item
  const renderHistoryItem = ({ item }: { item: HistoryRecord }) => {
    return (
      <View style={[
        styles.historyItem,
        item.taken ? styles.takenItem : styles.missedItem
      ]}>
        <View style={styles.itemHeader}>
          <View style={styles.medicineInfo}>
            <View 
              style={[
                styles.colorIndicator, 
                { backgroundColor: item.medicine.color || '#4263eb' }
              ]} 
            />
            <Text style={styles.medicineName}>{item.medicine.name}</Text>
          </View>
          <Text style={[
            styles.statusBadge,
            item.taken ? styles.takenBadge : styles.missedBadge
          ]}>
            {item.taken ? 'Taken' : 'Missed'}
          </Text>
        </View>
        
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Scheduled:</Text>
          <Text style={styles.timeValue}>{formatTime(item.time)}</Text>
        </View>
        
        {item.actualTime && (
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>{item.taken ? 'Taken at:' : 'Delayed to:'}</Text>
            <Text style={styles.timeValue}>{formatTime(item.actualTime)}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render year/month/day picker modal
  const renderCalendarPicker = () => {
    const years = Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return year;
    });
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    const [tempYear, setTempYear] = useState(selectedDate.getFullYear());
    const [tempMonth, setTempMonth] = useState(selectedDate.getMonth());
    const [tempDay, setTempDay] = useState(selectedDate.getDate());
    
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={calendarPickerVisible}
        onRequestClose={() => setCalendarPickerVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.calendarModalView}>
            <Text style={styles.modalTitle}>Select Date</Text>
            
            <View style={styles.pickerContainer}>
              {/* Year */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScrollView}>
                  {years.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        tempYear === year && styles.selectedPickerItem
                      ]}
                      onPress={() => setTempYear(year)}
                    >
                      <Text style={[
                        styles.pickerText,
                        tempYear === year && styles.selectedPickerText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Month */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScrollView}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        tempMonth === index && styles.selectedPickerItem
                      ]}
                      onPress={() => setTempMonth(index)}
                    >
                      <Text style={[
                        styles.pickerText,
                        tempMonth === index && styles.selectedPickerText
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Day */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScrollView}>
                  {days.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        tempDay === day && styles.selectedPickerItem
                      ]}
                      onPress={() => setTempDay(day)}
                    >
                      <Text style={[
                        styles.pickerText,
                        tempDay === day && styles.selectedPickerText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setCalendarPickerVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonConfirm]}
                onPress={() => {
                  const newDate = new Date(tempYear, tempMonth, tempDay);
                  setSelectedDate(newDate);
                  setCalendarPickerVisible(false);
                }}
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
    <View style={styles.container}>
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={goToPreviousDay}
        >
          <Text style={styles.dateNavButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateDisplay}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={goToNextDay}
        >
          <Text style={styles.dateNavButtonText}>→</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarRow}>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={showCalendarPicker}
        >
          <Text style={styles.calendarButtonText}>📅 Open Calendar</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      ) : filteredRecords.length > 0 ? (
        <FlatList
          data={filteredRecords}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `${item.medicine.id}-${item.timeIndex}-${index}`}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No medicine records for this day</Text>
          <Text style={styles.emptySubText}>
            Records will appear here after you take or delay a medicine.
          </Text>
        </View>
      )}
      
      {renderDatePicker()}
      {renderCalendarPicker()}
    </View>
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    backgroundColor: 'white'
  },
  dateNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#e9ecef'
  },
  dateNavButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057'
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 8
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40'
  },
  listContainer: {
    padding: 16
  },
  historyItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  takenItem: {
    backgroundColor: '#d3f9d8'
  },
  missedItem: {
    backgroundColor: '#ffe3e3'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40'
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 'bold'
  },
  takenBadge: {
    backgroundColor: '#40c057',
    color: 'white'
  },
  missedBadge: {
    backgroundColor: '#fa5252',
    color: 'white'
  },
  timeInfo: {
    flexDirection: 'row',
    marginTop: 4
  },
  timeLabel: {
    width: 80,
    fontSize: 14,
    color: '#495057'
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#343a40'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center'
  },
  emptySubText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '80%',
    maxHeight: '70%',
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
  datePickerContainer: {
    width: '100%',
    maxHeight: 300
  },
  datePickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    width: '100%'
  },
  selectedDateItem: {
    backgroundColor: '#e7f5ff'
  },
  datePickerText: {
    fontSize: 16
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: '#4263eb'
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: '#495057',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  headerIconContainer: {
    padding: 8,
  },
  headerCalendarIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  calendarRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  calendarButton: {
    backgroundColor: '#4263eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  calendarModalView: {
    width: '90%',
    height: 400,
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
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40'
  },
  pickerScrollView: {
    height: 200,
    width: '100%'
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6'
  },
  selectedPickerItem: {
    backgroundColor: '#e7f5ff'
  },
  pickerText: {
    fontSize: 16,
    color: '#495057'
  },
  selectedPickerText: {
    fontWeight: 'bold',
    color: '#4263eb'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
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
  }
});

export default MedicineHistoryScreen; 