import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  Image,
  Dimensions
} from "react-native";
import { Button, Field, Modal, Pill, TextInput, Picker } from "@/components/ui";
import { LabsAPI, CalendarAPI, ResourcesAPI, HistoryAPI } from "@/services/availability";
import { 
  formatDateISO, 
  addDays, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  getStatusPillColor,
  formatDateTime
} from "@/utils/helpers";
import type { Lab } from "@/types/lab";
import type { CalendarBlock, Resource, AvailabilityHistory } from "@/types/availability";

const { width } = Dimensions.get('window');

// ----------------------------- Selector de Laboratorio -----------------------------
const LabPicker: React.FC<{ 
  labId: number | null; 
  onChange: (id: number) => void 
}> = ({ labId, onChange }) => {
  const [labs, setLabs] = useState<Lab[]>([]);

  useEffect(() => {
    LabsAPI.list().then(setLabs).catch(() => {
      Alert.alert("Error", "No se pudieron cargar los laboratorios");
    });
  }, []);

  const labOptions = labs.map(lab => ({
    label: `${lab.name} (${lab.internal_code})`,
    value: lab.id.toString()
  }));

  return (
    <Picker
      label="Laboratorio"
      value={labId?.toString() || ""}
      onValueChange={(value) => onChange(Number(value))}
      options={labOptions}
      placeholder="Selecciona un laboratorio..."
    />
  );
};

// ----------------------------- Vista de Calendario -----------------------------
const CalendarView: React.FC<{ 
  labId: number; 
  canManage: boolean 
}> = ({ labId, canManage }) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [cursor, setCursor] = useState(new Date());
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarBlock>>({ 
    status: 'DISPONIBLE', 
    reason: 'evento' 
  });
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(cursor);
      const end = addDays(start, 7);
      return { from: formatDateISO(start), to: formatDateISO(end) };
    } else {
      const start = startOfMonth(cursor);
      const end = addDays(endOfMonth(cursor), 1);
      return { from: formatDateISO(start), to: formatDateISO(end) };
    }
  }, [view, cursor]);

  const loadData = async () => {
    try {
      setLoading(true);
      const calendarBlocks = await CalendarAPI.range(labId, range.from, range.to);
      setBlocks(calendarBlocks);
    } catch (error: any) {
      Alert.alert("Error", "No se pudieron cargar los bloques del calendario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [labId, range.from, range.to]);

  const save = async () => {
    try {
      await CalendarAPI.upsert(labId, formData);
      setModalOpen(false);
      setFormData({ status: 'DISPONIBLE', reason: 'evento' });
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    }
  };

  const remove = async (id: number) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este bloque?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await CalendarAPI.remove(id);
              loadData();
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendario</Text>
        <View style={styles.headerActions}>
          <View style={styles.navigation}>
            <Button onPress={() => setCursor(addDays(cursor, view === 'week' ? -7 : -30))}>
              ←
            </Button>
            <Text style={styles.dateText}>
              {cursor.toLocaleDateString('es-CR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
            <Button onPress={() => setCursor(addDays(cursor, view === 'week' ? 7 : 30))}>
              →
            </Button>
          </View>
          
          <Picker
            label=""
            value={view}
            onValueChange={(value) => setView(value as 'week' | 'month')}
            options={[
              { label: "Semanal", value: "week" },
              { label: "Mensual", value: "month" }
            ]}
          />
          
          {canManage && (
            <Button variant="solid" onPress={() => setModalOpen(true)}>
              + Bloque
            </Button>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Cargando calendario...</Text>
        </View>
      ) : (
        <View style={styles.calendarContainer}>
          {view === 'week' ? (
            <WeekGrid 
              cursor={cursor} 
              blocks={blocks} 
              canManage={canManage} 
              onEdit={(block) => {
                setFormData(block);
                setModalOpen(true);
              }} 
              onRemove={remove} 
            />
          ) : (
            <MonthGrid 
              cursor={cursor} 
              blocks={blocks} 
              canManage={canManage} 
              onEdit={(block) => {
                setFormData(block);
                setModalOpen(true);
              }} 
              onRemove={remove} 
            />
          )}
        </View>
      )}

      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={formData?.id ? 'Editar bloque' : 'Nuevo bloque'}
        footer={
          <View style={styles.modalFooter}>
            <Button onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="solid" onPress={save}>Guardar</Button>
          </View>
        }
      >
        <ScrollView>
          <Field label="Fecha" required>
            <TextInput
              value={formData.date || ''}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
            />
          </Field>

          <Field label="Estado" required>
            <Picker
              label=""
              value={formData.status || 'DISPONIBLE'}
              onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              options={[
                { label: "Disponible", value: "DISPONIBLE" },
                { label: "Bloqueado", value: "BLOQUEADO" }
              ]}
            />
          </Field>

          <Field label="Inicio" required>
            <TextInput
              value={formData.time_start || '08:00'}
              onChangeText={(text) => setFormData({ ...formData, time_start: text })}
              placeholder="HH:MM"
            />
          </Field>

          <Field label="Fin" required>
            <TextInput
              value={formData.time_end || '17:00'}
              onChangeText={(text) => setFormData({ ...formData, time_end: text })}
              placeholder="HH:MM"
            />
          </Field>

          <Field label="Motivo">
            <Picker
              label=""
              value={formData.reason || 'evento'}
              onValueChange={(value) => setFormData({ ...formData, reason: value as any })}
              options={[
                { label: "Evento", value: "evento" },
                { label: "Mantenimiento", value: "mantenimiento" },
                { label: "Uso exclusivo", value: "uso_exclusivo" }
              ]}
            />
          </Field>

          <Field label="Nota">
            <TextInput
              value={formData.note || ''}
              onChangeText={(text) => setFormData({ ...formData, note: text })}
              placeholder="Nota adicional"
              multiline
              numberOfLines={3}
            />
          </Field>

          {formData?.id && canManage && (
            <Button 
              onPress={() => formData.id && remove(formData.id)}
              style={styles.deleteButton}
            >
              Eliminar bloque
            </Button>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
};

// ----------------------------- Vista Semanal -----------------------------
const WeekGrid: React.FC<{ 
  cursor: Date; 
  blocks: CalendarBlock[]; 
  canManage: boolean; 
  onEdit: (block: CalendarBlock) => void; 
  onRemove: (id: number) => void 
}> = ({ cursor, blocks, canManage, onEdit }) => {
  const start = startOfWeek(cursor);
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7..19
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const getCellBlocks = (date: Date, hour: number) => {
    return blocks.filter(block => 
      block.date === formatDateISO(date) && 
      parseInt(block.time_start.slice(0, 2)) <= hour && 
      parseInt(block.time_end.slice(0, 2)) > hour
    );
  };

  const getBlockColor = (status: string) => {
    return status === 'DISPONIBLE' ? '#dcfce7' : '#fecaca';
  };

  const getBorderColor = (status: string) => {
    return status === 'DISPONIBLE' ? '#16a34a' : '#dc2626';
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.weekGrid}>
        <View style={styles.timeColumn}>
          <View style={styles.headerCell} />
          {hours.map(hour => (
            <View key={hour} style={styles.timeCell}>
              <Text style={styles.timeText}>{String(hour).padStart(2, '0')}:00</Text>
            </View>
          ))}
        </View>
        
        {days.map(day => (
          <View key={day.toDateString()} style={styles.dayColumn}>
            <View style={styles.headerCell}>
              <Text style={styles.dayText}>{day.toLocaleDateString('es-CR', { weekday: 'short' })}</Text>
              <Text style={styles.dateText}>{day.getDate()}</Text>
            </View>
            
            {hours.map(hour => {
              const cellBlocks = getCellBlocks(day, hour);
              return (
                <View key={`${day.toDateString()}-${hour}`} style={styles.hourCell}>
                  {cellBlocks.map(block => (
                    <TouchableOpacity
                      key={block.id}
                      style={[
                        styles.blockItem,
                        { 
                          backgroundColor: getBlockColor(block.status),
                          borderColor: getBorderColor(block.status)
                        }
                      ]}
                      onPress={() => canManage && onEdit(block)}
                    >
                      <Text style={styles.blockTime}>
                        {block.time_start}–{block.time_end}
                      </Text>
                      <Pill color={block.status === 'DISPONIBLE' ? 'green' : 'red'}>
                        {block.status === 'DISPONIBLE' ? 'Libre' : 'Bloq.'}
                      </Pill>
                      {block.reason && (
                        <Text style={styles.blockReason}>{block.reason}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// ----------------------------- Vista Mensual -----------------------------
const MonthGrid: React.FC<{ 
  cursor: Date; 
  blocks: CalendarBlock[]; 
  canManage: boolean; 
  onEdit: (block: CalendarBlock) => void; 
  onRemove: (id: number) => void 
}> = ({ cursor, blocks, canManage, onEdit }) => {
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);
  const days: Date[] = [];
  
  // Llenar días del mes
  const headPad = (start.getDay() + 6) % 7; // Lunes = 0
  for (let i = 0; i < headPad; i++) {
    days.push(addDays(start, -headPad + i));
  }
  for (let d = 1; d <= end.getDate(); d++) {
    days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  }
  while (days.length % 7 !== 0) {
    days.push(addDays(end, days.length % 7));
  }

  const getDayBlocks = (date: Date) => {
    return blocks.filter(block => block.date === formatDateISO(date));
  };

  const getBlockColor = (status: string) => {
    return status === 'DISPONIBLE' ? '#dcfce7' : '#fecaca';
  };

  return (
    <View style={styles.monthGrid}>
      {/* Headers */}
      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
        <View key={i} style={styles.monthHeader}>
          <Text style={styles.monthHeaderText}>{day}</Text>
        </View>
      ))}
      
      {/* Days */}
      {days.map((day, i) => {
        const inMonth = day.getMonth() === cursor.getMonth();
        const dayBlocks = getDayBlocks(day);
        
        return (
          <View 
            key={i} 
            style={[
              styles.monthDay,
              !inMonth && styles.monthDayOther
            ]}
          >
            <Text style={[
              styles.monthDayNumber,
              !inMonth && styles.monthDayNumberOther
            ]}>
              {day.getDate()}
            </Text>
            
            <View style={styles.monthBlocks}>
              {dayBlocks.map(block => (
                <TouchableOpacity
                  key={block.id}
                  style={[
                    styles.monthBlock,
                    { backgroundColor: getBlockColor(block.status) }
                  ]}
                  onPress={() => canManage && onEdit(block)}
                >
                  <Text style={styles.monthBlockTime}>
                    {block.time_start}-{block.time_end}
                  </Text>
                  <Pill color={block.status === 'DISPONIBLE' ? 'green' : 'red'}>
                    {block.status === 'DISPONIBLE' ? 'Libre' : 'Bloq.'}
                  </Pill>
                  {block.reason && (
                    <Text style={styles.monthBlockReason}>{block.reason}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ----------------------------- Catálogo de Recursos -----------------------------
const ResourceCatalog: React.FC<{ 
  labId: number; 
  canManage: boolean 
}> = ({ labId, canManage }) => {
  const [type, setType] = useState<Resource["type"] | "todos">('todos');
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Resource[]>([]);
  const [subscribing, setSubscribing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const resources = await ResourcesAPI.list(
        labId, 
        type === 'todos' ? undefined : type, 
        query
      );
      setItems(resources);
    } catch (error: any) {
      Alert.alert("Error", "No se pudieron cargar los recursos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [labId, type, query]);

  const changeStatus = async (resource: Resource, status: Resource["status"]) => {
    try {
      await ResourcesAPI.setStatus(resource.id, status);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    }
  };

  const subscribeLab = async () => {
    try {
      setSubscribing(true);
      await ResourcesAPI.subscribe(labId);
      Alert.alert("Éxito", "Suscripción activada para este laboratorio.");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    } finally {
      setSubscribing(false);
    }
  };

  const requestResource = (resource: Resource) => {
    Alert.alert(
      "Solicitar recurso",
      `¿Deseas solicitar el recurso "${resource.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Solicitar", onPress: () => {
          // Aquí se implementaría la navegación a la página de solicitudes
          Alert.alert("Info", "Funcionalidad de solicitud pendiente de implementar");
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recursos publicados</Text>
        <View style={styles.headerActions}>
          <Picker
            label=""
            value={type}
            onValueChange={(value) => setType(value as any)}
            options={[
              { label: "Todos", value: "todos" },
              { label: "Equipos", value: "equipo" },
              { label: "Materiales", value: "material" },
              { label: "Software", value: "software" }
            ]}
          />
          
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            value={query}
            onChangeText={setQuery}
          />
          
          <Button 
            onPress={subscribeLab} 
            disabled={subscribing}
          >
            🔔 Suscribirme
          </Button>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Cargando recursos...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No hay recursos para mostrar.</Text>
        </View>
      ) : (
        <ScrollView style={styles.resourcesList}>
          {items.map(resource => (
            <View key={resource.id} style={styles.resourceCard}>
              {resource.image_url ? (
                <Image 
                  source={{ uri: resource.image_url }} 
                  style={styles.resourceImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.resourceImagePlaceholder}>
                  <Text style={styles.placeholderText}>Sin foto</Text>
                </View>
              )}
              
              <View style={styles.resourceContent}>
                <View style={styles.resourceHeader}>
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <Pill color={getStatusPillColor(resource.status)}>
                    {resource.status.replace('_', ' ')}
                  </Pill>
                </View>
                
                <Text style={styles.resourceType}>
                  {resource.type.toUpperCase()}
                  {typeof resource.qty_available === 'number' && 
                    ` · Disp: ${resource.qty_available}`}
                </Text>
                
                {resource.description && (
                  <Text style={styles.resourceDescription} numberOfLines={3}>
                    {resource.description}
                  </Text>
                )}
                
                <View style={styles.resourceActions}>
                  <Button 
                    variant="solid" 
                    disabled={resource.status !== 'DISPONIBLE'}
                    onPress={() => requestResource(resource)}
                    style={styles.requestButton}
                  >
                    Solicitar
                  </Button>
                  
                  {canManage && (
                    <Picker
                      label=""
                      value={resource.status}
                      onValueChange={(value) => changeStatus(resource, value as Resource["status"])}
                      options={[
                        { label: "Disponible", value: "DISPONIBLE" },
                        { label: "Reservado", value: "RESERVADO" },
                        { label: "En mantenimiento", value: "EN_MANTENIMIENTO" },
                        { label: "Inactivo", value: "INACTIVO" }
                      ]}
                    />
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ----------------------------- Bitácora de Cambios -----------------------------
const AvailabilityHistory: React.FC<{ labId: number }> = ({ labId }) => {
  const [items, setItems] = useState<AvailabilityHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const history = await HistoryAPI.list(labId);
      setItems(history);
    } catch (error: any) {
      Alert.alert("Error", "No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [labId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bitácora de cambios</Text>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Sin registros.</Text>
        </View>
      ) : (
        <ScrollView style={styles.historyList}>
          {items.map(item => (
            <View key={item.id} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {formatDateTime(item.created_at)} · {item.user_name || 'Sistema'}
              </Text>
              <Text style={styles.historyAction}>
                <Text style={styles.historyEntity}>{item.entity}</Text> – {item.action}
              </Text>
              {item.detail && (
                <Text style={styles.historyDetail}>{item.detail}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ----------------------------- Página Principal -----------------------------
export default function DisponibilidadPage() {
  const [labId, setLabId] = useState<number | null>(null);
  // Simulamos permisos de usuario - en producción esto vendría del contexto de auth
  const canManage = true; // user?.role === 'ADMIN' || user?.role === 'TECNICO';

  return (
    <View style={styles.pageContainer}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Publicación de Disponibilidad y Recursos</Text>
        <LabPicker labId={labId} onChange={setLabId} />
      </View>

      {!labId ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Selecciona un laboratorio para administrar su disponibilidad.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <CalendarView labId={labId} canManage={canManage} />
          <ResourceCatalog labId={labId} canManage={canManage} />
          <AvailabilityHistory labId={labId} />
        </ScrollView>
      )}
    </View>
  );
}

// ----------------------------- Estilos -----------------------------
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    minWidth: 100,
    textAlign: 'center',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  calendarContainer: {
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    marginTop: 16,
  },
  // Estilos para vista semanal
  weekGrid: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 60,
  },
  dayColumn: {
    width: 120,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  headerCell: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  timeCell: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourCell: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  blockItem: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
  },
  blockTime: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
  },
  blockReason: {
    fontSize: 9,
    color: '#6b7280',
  },
  // Estilos para vista mensual
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthHeader: {
    width: width / 7 - 2,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  monthDay: {
    width: width / 7 - 2,
    height: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4,
  },
  monthDayOther: {
    backgroundColor: '#f9fafb',
  },
  monthDayNumber: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  monthDayNumberOther: {
    color: '#9ca3af',
  },
  monthBlocks: {
    flex: 1,
  },
  monthBlock: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 2,
    marginBottom: 2,
  },
  monthBlockTime: {
    fontSize: 8,
    color: '#374151',
  },
  monthBlockReason: {
    fontSize: 7,
    color: '#6b7280',
  },
  searchInput: {
    flex: 1,
    minWidth: 120,
  },
  resourcesList: {
    maxHeight: 400,
  },
  resourceCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  resourceImage: {
    width: '100%',
    height: 160,
  },
  resourceImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  resourceContent: {
    padding: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  resourceType: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestButton: {
    flex: 1,
    marginRight: 8,
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  historyAction: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyEntity: {
    fontWeight: '600',
  },
  historyDetail: {
    fontSize: 14,
    color: '#374151',
  },
});
