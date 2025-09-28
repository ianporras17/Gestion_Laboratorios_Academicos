import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CalendarService } from '@/services/calendarService';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';

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

interface Filters {
  lab_id?: string;
  resource_id?: string;
  status?: string;
  view_type: 'week' | 'month';
}

export default function CalendarScreen() {
  const router = useRouter();
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    view_type: 'week'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadCalendarData();
  }, [filters, currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      let response;
      if (filters.view_type === 'week') {
        const weekStart = getWeekStart(currentDate);
        response = await CalendarService.getWeeklyView({
          ...filters,
          week_start: weekStart.toISOString()
        });
      } else {
        response = await CalendarService.getMonthlyView({
          ...filters,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1
        });
      }
      
      if (response.success) {
        setSlots(response.data);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los datos del calendario');
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalendarData();
    setRefreshing(false);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    return new Date(d.setDate(diff));
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleViewTypeChange = (viewType: 'week' | 'month') => {
    setFilters(prev => ({ ...prev, view_type: viewType }));
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (filters.view_type === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const handleSlotPress = (slot: CalendarSlot) => {
    if (slot.resource_id) {
      router.push(`/resource-catalog/${slot.resource_id}`);
    } else {
      router.push(`/labs/${slot.lab_id}`);
    }
  };

  const handleCreateSlot = () => {
    router.push('/calendar/create-slot');
  };

  const formatDateRange = () => {
    if (filters.view_type === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      return `${weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Cargando calendario...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.title}>Calendario</ThemedText>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSlot}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* View Type Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              filters.view_type === 'week' && styles.activeToggle
            ]}
            onPress={() => handleViewTypeChange('week')}
          >
            <ThemedText style={[
              styles.toggleText,
              filters.view_type === 'week' && styles.activeToggleText
            ]}>
              Semana
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              filters.view_type === 'month' && styles.activeToggle
            ]}
            onPress={() => handleViewTypeChange('month')}
          >
            <ThemedText style={[
              styles.toggleText,
              filters.view_type === 'month' && styles.activeToggleText
            ]}>
              Mes
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleDateChange('prev')}
          >
            <Ionicons name="chevron-back" size={24} color={tintColor} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setCurrentDate(new Date())}
          >
            <ThemedText style={styles.dateText}>{formatDateRange()}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleDateChange('next')}
          >
            <Ionicons name="chevron-forward" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color={tintColor} />
            <ThemedText style={[styles.filterText, { color: tintColor }]}>
              Filtros
            </ThemedText>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <CalendarFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}
      </View>

      {/* Calendar Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filters.view_type === 'week' ? (
          <CalendarWeekView
            slots={slots}
            currentDate={currentDate}
            onSlotPress={handleSlotPress}
          />
        ) : (
          <CalendarMonthView
            slots={slots}
            currentDate={currentDate}
            onSlotPress={handleSlotPress}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#0a7ea4',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#0a7ea4',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeToggleText: {
    color: 'white',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContainer: {
    alignItems: 'flex-start',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
