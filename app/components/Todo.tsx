import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Medicine } from '../models/Medicine';

interface TodoProps {
  medicine: Medicine;
  onToggle: (id: string, timeIndex: number) => void;
  onDelay: (medicine: Medicine, timeIndex: number) => void;
  onPress: () => void;
}

const Todo: React.FC<TodoProps> = ({ medicine, onToggle, onDelay, onPress }) => {
  // Function to format time in 12-hour format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Function to check if a time is past due
  const isPastDue = (timeString: string) => {
    const now = new Date();
    const [hours, minutes] = timeString.split(':');
    const scheduleTime = new Date();
    scheduleTime.setHours(parseInt(hours));
    scheduleTime.setMinutes(parseInt(minutes));
    scheduleTime.setSeconds(0);
    
    // If the time has a custom delay for today
    if (medicine.delayedTime) {
      return now > new Date(medicine.delayedTime);
    }
    
    return now > scheduleTime;
  };

  // Function to get today's dosage based on daily or cyclic configuration
  const getTodayDosage = () => {
    // Check if medicine has cyclic dosage
    if (medicine.cyclicDosage) {
      const { sequence, startDate, currentPosition = 0 } = medicine.cyclicDosage;
      
      // If sequence is empty, return standard dosage
      if (!sequence.length) {
        return medicine.dosage;
      }
      
      // Calculate days since the cycle started
      const start = new Date(startDate);
      const today = new Date();
      
      // Reset hours, minutes, seconds and milliseconds for accurate day calculation
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      // Calculate days since start
      const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // If cycle hasn't started yet, return standard dosage
      if (daysSinceStart < 0) {
        return medicine.dosage;
      }
      
      // Calculate position in sequence
      const position = (currentPosition + daysSinceStart) % sequence.length;
      
      // Return dosage for current position in sequence
      return sequence[position];
    }
    
    // Check for daily variable dosages based on day of week
    if (medicine.dailyDosages) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const todayDosage = medicine.dailyDosages.find(d => d.day === dayOfWeek);
      return todayDosage ? todayDosage.dosage : medicine.dosage;
    }
    
    // Default to standard dosage
    return medicine.dosage;
  };

  // Format dosage display (handle decimals nicely)
  const formatDosage = (dosage: number) => {
    if (Number.isInteger(dosage)) {
      return dosage.toString();
    }
    return dosage.toFixed(1);
  };

  // Current day's dosage
  const todayDosage = getTodayDosage();

  return (
    <TouchableOpacity 
      style={styles.todoItem} 
      onPress={onPress}
    >
      <View style={styles.medicineHeader}>
        <View style={styles.medicineInfo}>
          <View 
            style={[
              styles.colorIndicator, 
              { backgroundColor: medicine.color || '#4263eb' }
            ]} 
          />
          <Text style={styles.medicineName}>{medicine.name}</Text>
        </View>
        
        {/* Today's dosage indicator */}
        <View style={styles.dosageContainer}>
          <Text style={styles.dosageText}>
            {formatDosage(todayDosage)} {todayDosage === 1 ? 'unit' : 'units'}
          </Text>
        </View>
      </View>
      
      {medicine.times.map((time, index) => (
        <View key={index} style={styles.timeContainer}>
          <Text 
            style={[
              styles.timeText,
              isPastDue(time.time) && !time.taken && styles.pastDue
            ]}
          >
            {time.delayedTime 
              ? `${formatTime(time.time)} (Delayed)` 
              : formatTime(time.time)
            }
          </Text>
          
          <View style={styles.actions}>
            {isPastDue(time.time) && !time.taken && (
              <TouchableOpacity
                style={styles.delayButton}
                onPress={() => onDelay(medicine, index)}
              >
                <Text style={styles.delayButtonText}>Delay</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.checkButton,
                time.taken && styles.checkButtonTaken
              ]}
              onPress={() => onToggle(medicine.id, index)}
            >
              <Text style={styles.checkButtonText}>
                {time.taken ? '✓' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  todoItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40'
  },
  dosageContainer: {
    backgroundColor: '#e9ecef',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  dosageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057'
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5'
  },
  timeText: {
    fontSize: 16,
    color: '#495057'
  },
  pastDue: {
    color: '#e03131'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  delayButton: {
    backgroundColor: '#ffe066',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8
  },
  delayButtonText: {
    color: '#664d03',
    fontWeight: 'bold',
    fontSize: 12
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4263eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonTaken: {
    backgroundColor: '#4263eb'
  },
  checkButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default Todo; 