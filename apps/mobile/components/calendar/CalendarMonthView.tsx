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

interface CalendarSlot {
  id: string;
  lab_id: string;
  resource_id?: string;
  starts_at: string;
  ends_at: string;
  status: 'DISPONIBLE' | 'BLOQUEADO' | 'RESERVADO' | 'MANTENIMIENTO' | 'EXCLUSIVO';
  reason?: string;
  lab_name: string;
  resource_name?: string;
  resource_type?: string;
  created_by_name?: string;
}

interface CalendarMonthViewProps {
  slots: CalendarSlot[];
  currentDate: Date;
  onSlotPress: (slot: CalendarSlot) => void;
}

export function CalendarMonthView({ slots, currentDate, onSlotPress }: CalendarMonthViewProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Lunes
    
    const days = [];
    const current = new Date(startDate);
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getDaySlots = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return slots.filter(slot => {
      const slotStart = new Date(slot.starts_at);
      return slotStart >= dayStart && slotStart <= dayEnd;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONIBLE':
        return '#4CAF50';
      case 'BLOQUEADO':
        return '#F44336';
      case 'RESERVADO':
        return '#FF9800';
      case 'MANTENIMIENTO':
        return '#9C27B0';
      case 'EXCLUSIVO':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentDate.getMonth();
  };

  const isToday = (day: Date) => {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const monthDays = getMonthDays(currentDate);
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {dayNames.map((dayName, index) => (
            <View key={index} style={styles.dayHeader}>
              <ThemedText style={styles.dayName}>
                {dayName}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {monthDays.map((day, index) => {
            const daySlots = getDaySlots(day);
            const isCurrentMonthDay = isCurrentMonth(day);
            const isTodayDay = isToday(day);
            
            return (
              <View key={index} style={styles.dayCell}>
                <View style={[
                  styles.dayNumberContainer,
                  isTodayDay && styles.todayContainer
                ]}>
                  <ThemedText style={[
                    styles.dayNumber,
                    !isCurrentMonthDay && styles.otherMonthDay,
                    isTodayDay && styles.todayText
                  ]}>
                    {day.getDate()}
                  </ThemedText>
                </View>
                
                <View style={styles.slotsContainer}>
                  {daySlots.slice(0, 3).map((slot, slotIndex) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotDot,
                        { backgroundColor: getStatusColor(slot.status) }
                      ]}
                      onPress={() => onSlotPress(slot)}
                    >
                      <ThemedText style={styles.slotTime} numberOfLines={1}>
                        {formatTime(slot.starts_at)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                  
                  {daySlots.length > 3 && (
                    <View style={styles.moreSlots}>
                      <ThemedText style={styles.moreText}>
                        +{daySlots.length - 3}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <ThemedText style={styles.legendTitle}>Leyenda:</ThemedText>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <ThemedText style={styles.legendText}>Disponible</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <ThemedText style={styles.legendText}>Reservado</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <ThemedText style={styles.legendText}>Bloqueado</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
              <ThemedText style={styles.legendText}>Mantenimiento</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 4,
  },
  dayNumberContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  todayContainer: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  slotsContainer: {
    flex: 1,
    gap: 2,
  },
  slotDot: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 1,
  },
  slotTime: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
  },
  moreSlots: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  moreText: {
    fontSize: 8,
    opacity: 0.6,
    fontWeight: '600',
  },
  legend: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    opacity: 0.8,
  },
});
