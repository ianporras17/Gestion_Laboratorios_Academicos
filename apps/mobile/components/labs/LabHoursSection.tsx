import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LabOpenHour {
  id: string;
  weekday: number;
  time_start: string;
  time_end: string;
}

interface Lab {
  id: string;
  name: string;
  open_hours: LabOpenHour[];
}

interface LabHoursSectionProps {
  lab: Lab;
  onManage: () => void;
}

export function LabHoursSection({ lab, onManage }: LabHoursSectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const getWeekdayName = (weekday: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[weekday];
  };

  const getWeekdayShortName = (weekday: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[weekday];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const groupHoursByDay = () => {
    const grouped: { [key: number]: LabOpenHour[] } = {};
    lab.open_hours.forEach(hour => {
      if (!grouped[hour.weekday]) {
        grouped[hour.weekday] = [];
      }
      grouped[hour.weekday].push(hour);
    });
    return grouped;
  };

  const groupedHours = groupHoursByDay();
  const sortedDays = Object.keys(groupedHours).map(Number).sort();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Horarios de Funcionamiento</ThemedText>
          <TouchableOpacity style={styles.manageButton} onPress={onManage}>
            <Ionicons name="settings-outline" size={16} color={tintColor} />
            <ThemedText style={[styles.manageButtonText, { color: tintColor }]}>
              Gestionar
            </ThemedText>
          </TouchableOpacity>
        </View>

        {lab.open_hours.length > 0 ? (
          <View style={styles.hoursContent}>
            {sortedDays.map(weekday => (
              <View key={weekday} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Ionicons name="calendar-outline" size={20} color={tintColor} />
                  <ThemedText style={styles.dayName}>
                    {getWeekdayName(weekday)}
                  </ThemedText>
                </View>
                <View style={styles.timeSlots}>
                  {groupedHours[weekday].map((hour, index) => (
                    <View key={hour.id} style={styles.timeSlot}>
                      <ThemedText style={styles.timeText}>
                        {formatTime(hour.time_start)} - {formatTime(hour.time_end)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={iconColor} />
            <ThemedText style={styles.emptyTitle}>No hay horarios definidos</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Este laboratorio no tiene horarios de funcionamiento establecidos
            </ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={onManage}>
              <Ionicons name="add" size={20} color="white" />
              <ThemedText style={styles.addButtonText}>Definir Horarios</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  hoursContent: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeSlots: {
    gap: 4,
  },
  timeSlot: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginLeft: 28,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
