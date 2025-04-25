export interface MedicineTime {
  time: string; // HH:MM format
  taken: boolean;
  delayedTime?: Date; // For storing delayed time for today
}

export interface DailyDosage {
  day: number; // 0-6 (domenica-sabato)
  dosage: number; // Number of pills/units for this specific day
}

export interface CyclicDosage {
  sequence: number[]; // Sequenza di dosaggi che si ripete ciclicamente
  startDate: string; // Data di inizio del ciclo
  currentPosition?: number; // Posizione attuale nella sequenza
}

export interface Medicine {
  id: string;
  name: string;
  color?: string;
  frequency: 'daily' | 'custom'; // daily = every day, custom = specific days
  daysOfWeek?: boolean[]; // Per frequency === 'custom'
  times: MedicineTime[]; // Array of times for this medicine
  dosage: number; // Dosaggio standard
  dailyDosages?: DailyDosage[]; // Dosaggi variabili per giorno della settimana
  cyclicDosage?: CyclicDosage; // Dosaggio ciclico
  delayedTime?: Date; // For storing delayed time for today
} 