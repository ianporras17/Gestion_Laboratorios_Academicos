import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Dimensions } from "react-native";
import { 
  CalendarAPI, 
  ResourcesAPI, 
  SubscriptionsAPI, 
  ChangelogAPI, 
  NotificationsAPI, 
  StatsAPI,
  AvailabilityValidations,
  AvailabilityUtils 
} from "@/services/availability";
import { 
  CalendarSlot, 
  Resource, 
  AvailabilitySubscription, 
  PublishChangelog, 
  Notification, 
  AvailabilityStats,
  CalendarView,
  CalendarEvent
} from "@/types/availability";

/**
 * Módulo 1.2 – Publicación de Disponibilidad y Recursos (React Native + TypeScript)
 * 
 * Ventana completa basada en las tablas SQL:
 *  - Gestión de calendario con vistas semanal y mensual
 *  - Publicación de recursos con catálogo por tipo
 *  - Estados de disponibilidad y transiciones
 *  - Suscripciones y notificaciones
 *  - Bitácora de cambios
 */

const { width } = Dimensions.get('window');

// ----------------------------- Componentes UI básicos -----------------------------
const Button: React.FC<{ onPress: () => void; style?: any; children: React.ReactNode; disabled?: boolean }> = ({ onPress, style, children, disabled }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, style, disabled && styles.disabledButton]} disabled={disabled}>
    {children}
  </TouchableOpacity>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    {children}
  </View>
);

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </View>
  );
};

const Pill: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = "blue", children }) => (
  <View style={[styles.pill, { backgroundColor: color }]}>
    <Text style={styles.pillText}>{children}</Text>
  </View>
);

// ----------------------------- Componente de Calendario -----------------------------
const CalendarView: React.FC<{ 
  view: CalendarView; 
  slots: CalendarSlot[]; 
  onSlotPress: (slot: CalendarSlot) => void;
  onDateChange: (date: Date) => void;
}> = ({ view, slots, onSlotPress, onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };
  
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Días del mes siguiente para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };
  
  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(slot => 
      slot.starts_at.startsWith(dateStr) || 
      slot.ends_at.startsWith(dateStr)
    );
  };
  
  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    
    return (
      <View style={styles.weekView}>
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayHeader}>
              <Text style={styles.weekDayName}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][index]}
              </Text>
              <Text style={styles.weekDayNumber}>{day.getDate()}</Text>
            </View>
          ))}
        </View>
        <View style={styles.weekContent}>
          {weekDays.map((day, index) => {
            const daySlots = getSlotsForDate(day);
            return (
              <View key={index} style={styles.weekDay}>
                {daySlots.map((slot, slotIndex) => (
                  <TouchableOpacity
                    key={slotIndex}
                    style={[
                      styles.slotItem,
                      { backgroundColor: AvailabilityUtils.getStatusColor(slot.status) }
                    ]}
                    onPress={() => onSlotPress(slot)}
                  >
                    <Text style={styles.slotTime}>
                      {AvailabilityUtils.formatCalendarTime(slot.starts_at)} - 
                      {AvailabilityUtils.formatCalendarTime(slot.ends_at)}
                    </Text>
                    <Text style={styles.slotResource} numberOfLines={1}>
                      {slot.resource_name || slot.lab_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>
      </View>
    );
  };
  
  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate);
    
    return (
      <View style={styles.monthView}>
        <View style={styles.monthHeader}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
            <View key={index} style={styles.monthDayHeader}>
              <Text style={styles.monthDayName}>{day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {monthDays.map((day, index) => {
            const daySlots = getSlotsForDate(day.date);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthDay,
                  !day.isCurrentMonth && styles.monthDayInactive,
                  day.date.toDateString() === new Date().toDateString() && styles.monthDayToday
                ]}
                onPress={() => onDateChange(day.date)}
              >
                <Text style={[
                  styles.monthDayNumber,
                  !day.isCurrentMonth && styles.monthDayNumberInactive,
                  day.date.toDateString() === new Date().toDateString() && styles.monthDayNumberToday
                ]}>
                  {day.date.getDate()}
                </Text>
                {daySlots.length > 0 && (
                  <View style={styles.monthDaySlots}>
                    {daySlots.slice(0, 2).map((slot, slotIndex) => (
                      <View
                        key={slotIndex}
                        style={[
                          styles.monthSlot,
                          { backgroundColor: AvailabilityUtils.getStatusColor(slot.status) }
                        ]}
                      />
                    ))}
                    {daySlots.length > 2 && (
                      <Text style={styles.monthSlotMore}>+{daySlots.length - 2}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Button onPress={() => setCurrentDate(new Date(currentDate.getTime() - (view === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000))}>
          <Text style={styles.buttonText}>‹</Text>
        </Button>
        <Text style={styles.calendarTitle}>
          {view === 'week' 
            ? `Semana del ${currentDate.toLocaleDateString()}`
            : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
          }
        </Text>
        <Button onPress={() => setCurrentDate(new Date(currentDate.getTime() + (view === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000))}>
          <Text style={styles.buttonText}>›</Text>
        </Button>
      </View>
      {view === 'week' ? renderWeekView() : renderMonthView()}
    </View>
  );
};

// ----------------------------- Componente de Recursos -----------------------------
const ResourcesList: React.FC<{ 
  resources: Resource[]; 
  onResourcePress: (resource: Resource) => void;
  onSubscribe: (resource: Resource) => void;
}> = ({ resources, onResourcePress, onSubscribe }) => {
  return (
    <ScrollView style={styles.resourcesList}>
      {resources.map(resource => (
        <TouchableOpacity
          key={resource.id}
          style={styles.resourceCard}
          onPress={() => onResourcePress(resource)}
        >
          <View style={styles.resourceHeader}>
            <Text style={styles.resourceName}>{resource.name}</Text>
            <Pill color={AvailabilityUtils.getStatusColor(resource.state)}>
              {AvailabilityUtils.getStatusText(resource.state)}
            </Pill>
          </View>
          
          <Text style={styles.resourceType}>{resource.type}</Text>
          <Text style={styles.resourceLocation}>{resource.lab_name} - {resource.lab_location}</Text>
          
          {resource.description && (
            <Text style={styles.resourceDescription} numberOfLines={2}>
              {resource.description}
            </Text>
          )}
          
          {resource.type === 'CONSUMABLE' && (
            <View style={styles.resourceStock}>
              <Text style={styles.stockText}>
                Stock: {resource.qty_available} {resource.unit}
              </Text>
              {AvailabilityUtils.needsReorder(resource) && (
                <Pill color="#F44336">Bajo Stock</Pill>
              )}
            </View>
          )}
          
          <View style={styles.resourceActions}>
            <Button 
              style={styles.subscribeButton}
              onPress={() => onSubscribe(resource)}
            >
              <Text style={styles.buttonText}>Suscribirse</Text>
            </Button>
            <Button 
              style={styles.requestButton}
              onPress={() => onResourcePress(resource)}
            >
              <Text style={styles.buttonText}>Solicitar</Text>
            </Button>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ----------------------------- Componente de Estadísticas -----------------------------
const StatsView: React.FC<{ stats: AvailabilityStats }> = ({ stats }) => {
  const total = stats.total_slots;
  const available = stats.available_slots;
  const reserved = stats.reserved_slots;
  const blocked = stats.blocked_slots;
  const maintenance = stats.maintenance_slots;
  const exclusive = stats.exclusive_slots;
  
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Estadísticas de Disponibilidad</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{available}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>{reserved}</Text>
          <Text style={styles.statLabel}>Reservados</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F44336' }]}>{blocked}</Text>
          <Text style={styles.statLabel}>Bloqueados</Text>
        </View>
      </View>
      
      <View style={styles.statsChart}>
        <View style={[styles.chartBar, { width: `${(available / total) * 100}%`, backgroundColor: '#4CAF50' }]} />
        <View style={[styles.chartBar, { width: `${(reserved / total) * 100}%`, backgroundColor: '#FF9800' }]} />
        <View style={[styles.chartBar, { width: `${(blocked / total) * 100}%`, backgroundColor: '#F44336' }]} />
      </View>
    </View>
  );
};

// ----------------------------- Página principal -----------------------------
export default function DisponibilidadPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'resources' | 'stats' | 'notifications'>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<AvailabilityStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsData, resourcesData, statsData, notificationsData] = await Promise.all([
        CalendarAPI.list(),
        ResourcesAPI.list(),
        StatsAPI.get(),
        NotificationsAPI.list({ user_id: 1, limit: 20 }) // TODO: Obtener user_id real
      ]);
      
      setSlots(slotsData);
      setResources(resourcesData);
      setStats(statsData);
      setNotifications(notificationsData);
    } catch (error) {
      Alert.alert("Error", "Error cargando datos: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSlotPress = (slot: CalendarSlot) => {
    setSelectedSlot(slot);
    setShowSlotModal(true);
  };

  const handleResourcePress = (resource: Resource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
  };

  const handleSubscribe = async (resource: Resource) => {
    try {
      await SubscriptionsAPI.create({
        user_id: 1, // TODO: Obtener user_id real
        resource_id: resource.id
      });
      Alert.alert("Éxito", "Te has suscrito a las notificaciones de este recurso");
    } catch (error) {
      Alert.alert("Error", "Error al suscribirse: " + (error as any).message);
    }
  };

  const tabs = [
    { id: 'calendar', label: 'Calendario', icon: '📅' },
    { id: 'resources', label: 'Recursos', icon: '🔧' },
    { id: 'stats', label: 'Estadísticas', icon: '📊' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
  ];

  return (
    <View style={styles.pageContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Disponibilidad y Recursos</Text>
        <Button onPress={loadData} style={styles.refreshButton}>
          <Text style={styles.buttonText}>🔄</Text>
        </Button>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'calendar' && (
              <View>
                <View style={styles.viewToggle}>
                  <Button 
                    style={[styles.viewButton, calendarView === 'week' && styles.activeViewButton]}
                    onPress={() => setCalendarView('week')}
                  >
                    <Text style={styles.buttonText}>Semana</Text>
                  </Button>
                  <Button 
                    style={[styles.viewButton, calendarView === 'month' && styles.activeViewButton]}
                    onPress={() => setCalendarView('month')}
                  >
                    <Text style={styles.buttonText}>Mes</Text>
                  </Button>
                </View>
                <CalendarView
                  view={calendarView}
                  slots={slots}
                  onSlotPress={handleSlotPress}
                  onDateChange={(date) => console.log('Date changed:', date)}
                />
              </View>
            )}

            {activeTab === 'resources' && (
              <ResourcesList
                resources={resources}
                onResourcePress={handleResourcePress}
                onSubscribe={handleSubscribe}
              />
            )}

            {activeTab === 'stats' && stats && (
              <StatsView stats={stats} />
            )}

            {activeTab === 'notifications' && (
              <ScrollView style={styles.notificationsList}>
                {notifications.map(notification => (
                  <View key={notification.id} style={styles.notificationItem}>
                    <Text style={styles.notificationSubject}>{notification.subject}</Text>
                    <Text style={styles.notificationBody}>{notification.body}</Text>
                    <Text style={styles.notificationDate}>
                      {new Date(notification.sent_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Modales */}
      <Modal open={showSlotModal} onClose={() => setShowSlotModal(false)} title="Detalle del Slot">
        {selectedSlot && (
          <View style={styles.modalContent}>
            <Text style={styles.slotTitle}>{selectedSlot.resource_name || selectedSlot.lab_name}</Text>
            <Text style={styles.modalSlotTime}>
              {AvailabilityUtils.formatCalendarTime(selectedSlot.starts_at)} - 
              {AvailabilityUtils.formatCalendarTime(selectedSlot.ends_at)}
            </Text>
            <Pill color={AvailabilityUtils.getStatusColor(selectedSlot.status)}>
              {AvailabilityUtils.getStatusText(selectedSlot.status)}
            </Pill>
            {selectedSlot.reason && (
              <Text style={styles.slotReason}>Motivo: {selectedSlot.reason}</Text>
            )}
          </View>
        )}
      </Modal>

      <Modal open={showResourceModal} onClose={() => setShowResourceModal(false)} title="Detalle del Recurso">
        {selectedResource && (
          <View style={styles.modalContent}>
            <Text style={styles.resourceTitle}>{selectedResource.name}</Text>
            <Text style={styles.resourceType}>{selectedResource.type}</Text>
            <Pill color={AvailabilityUtils.getStatusColor(selectedResource.state)}>
              {AvailabilityUtils.getStatusText(selectedResource.state)}
            </Pill>
            <Text style={styles.resourceLocation}>{selectedResource.lab_name}</Text>
            {selectedResource.description && (
              <Text style={styles.resourceDescription}>{selectedResource.description}</Text>
            )}
            {selectedResource.type === 'CONSUMABLE' && (
              <Text style={styles.stockText}>
                Stock: {selectedResource.qty_available} {selectedResource.unit}
              </Text>
            )}
            <View style={styles.resourceActions}>
              <Button style={styles.subscribeButton} onPress={() => handleSubscribe(selectedResource)}>
                <Text style={styles.buttonText}>Suscribirse</Text>
              </Button>
              <Button style={styles.requestButton} onPress={() => {}}>
                <Text style={styles.buttonText}>Solicitar</Text>
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ----------------------------- Estilos -----------------------------
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
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
    fontSize: 16,
    color: '#666',
  },
  // Calendario
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewToggle: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  activeViewButton: {
    backgroundColor: '#007AFF',
  },
  // Vista semanal
  weekView: {
    backgroundColor: 'white',
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  weekContent: {
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    minHeight: 100,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  slotItem: {
    padding: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  slotTime: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  slotResource: {
    fontSize: 10,
    color: 'white',
  },
  // Vista mensual
  monthView: {
    backgroundColor: 'white',
  },
  monthHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  monthDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  monthDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDay: {
    width: width / 7,
    height: 60,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    padding: 4,
    justifyContent: 'space-between',
  },
  monthDayInactive: {
    backgroundColor: '#f9f9f9',
  },
  monthDayToday: {
    backgroundColor: '#e3f2fd',
  },
  monthDayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  monthDayNumberInactive: {
    color: '#ccc',
  },
  monthDayNumberToday: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  monthDaySlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthSlot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 2,
    marginBottom: 2,
  },
  monthSlotMore: {
    fontSize: 8,
    color: '#666',
  },
  // Recursos
  resourcesList: {
    flex: 1,
  },
  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  resourceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resourceLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resourceStock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  subscribeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 6,
  },
  requestButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 6,
  },
  // Estadísticas
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsChart: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
  },
  // Notificaciones
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  notificationSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  // Modales
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    padding: 16,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalSlotTime: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  slotReason: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  // Componentes UI básicos
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  required: {
    color: '#ff4444',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
