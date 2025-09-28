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

interface CalendarWeekViewProps {
  slots: CalendarSlot[];
  currentDate: Date;
  onSlotPress: (slot: CalendarSlot) => void;
}

export function CalendarWeekView({ slots, currentDate, onSlotPress }: CalendarWeekViewProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DISPONIBLE':
        return 'checkmark-circle-outline';
      case 'BLOQUEADO':
        return 'close-circle-outline';
      case 'RESERVADO':
        return 'time-outline';
      case 'MANTENIMIENTO':
        return 'construct-outline';
      case 'EXCLUSIVO':
        return 'lock-closed-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = getWeekDays(weekStart);
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.dayHeader}>
              <ThemedText style={styles.dayName}>
                {dayNames[index]}
              </ThemedText>
              <ThemedText style={styles.dayNumber}>
                {day.getDate()}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Time Slots */}
        <View style={styles.timeSlots}>
          {weekDays.map((day, dayIndex) => {
            const daySlots = getDaySlots(day);
            
            return (
              <View key={dayIndex} style={styles.dayColumn}>
                {daySlots.length > 0 ? (
                  daySlots.map((slot, slotIndex) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotCard,
                        { backgroundColor: getStatusColor(slot.status) + '20' }
                      ]}
                      onPress={() => onSlotPress(slot)}
                    >
                      <View style={styles.slotHeader}>
                        <Ionicons
                          name={getStatusIcon(slot.status) as any}
                          size={16}
                          color={getStatusColor(slot.status)}
                        />
                        <ThemedText style={[
                          styles.slotTime,
                          { color: getStatusColor(slot.status) }
                        ]}>
                          {formatTime(slot.starts_at)} - {formatTime(slot.ends_at)}
                        </ThemedText>
                      </View>
                      
                      <ThemedText style={styles.slotTitle} numberOfLines={1}>
                        {slot.resource_name || slot.lab_name}
                      </ThemedText>
                      
                      {slot.resource_type && (
                        <ThemedText style={styles.slotType} numberOfLines={1}>
                          {slot.resource_type}
                        </ThemedText>
                      )}
                      
                      {slot.reason && (
                        <ThemedText style={styles.slotReason} numberOfLines={1}>
                          {slot.reason}
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyDay}>
                    <ThemedText style={styles.emptyText}>
                      Sin eventos
                    </ThemedText>
                  </View>
                )}
              </View>
            );
          })}
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
    marginBottom: 16,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 2,
    borderRadius: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeSlots: {
    flexDirection: 'row',
    flex: 1,
  },
  dayColumn: {
    flex: 1,
    marginHorizontal: 2,
    minHeight: 400,
  },
  slotCard: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  slotType: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  slotReason: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  emptyDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
  },
});
