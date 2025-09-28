import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LabService } from '@/services/labService';
import { ResourceService } from '@/services/resourceService';

interface Lab {
  id: string;
  name: string;
  internal_code: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
}

interface Filters {
  lab_id?: string;
  resource_id?: string;
  status?: string;
  view_type: 'week' | 'month';
}

interface CalendarFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onClose: () => void;
}

export function CalendarFilters({ filters, onFilterChange, onClose }: CalendarFiltersProps) {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar laboratorios
      const labsResponse = await LabService.getLabs({ is_active: true });
      if (labsResponse.success) {
        setLabs(labsResponse.data);
      }
      
      // Cargar recursos
      const resourcesResponse = await ResourceService.getResources({ is_public: true });
      if (resourcesResponse.success) {
        setResources(resourcesResponse.data);
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabSelect = (labId: string) => {
    onFilterChange({
      lab_id: filters.lab_id === labId ? undefined : labId,
      resource_id: undefined // Limpiar recurso si se selecciona laboratorio
    });
  };

  const handleResourceSelect = (resourceId: string) => {
    onFilterChange({
      resource_id: filters.resource_id === resourceId ? undefined : resourceId,
      lab_id: undefined // Limpiar laboratorio si se selecciona recurso
    });
  };

  const handleStatusSelect = (status: string) => {
    onFilterChange({
      status: filters.status === status ? undefined : status
    });
  };

  const clearFilters = () => {
    onFilterChange({
      lab_id: undefined,
      resource_id: undefined,
      status: undefined
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.lab_id) count++;
    if (filters.resource_id) count++;
    if (filters.status) count++;
    return count;
  };

  const statusOptions = [
    { value: 'DISPONIBLE', label: 'Disponible', color: '#4CAF50' },
    { value: 'RESERVADO', label: 'Reservado', color: '#FF9800' },
    { value: 'BLOQUEADO', label: 'Bloqueado', color: '#F44336' },
    { value: 'MANTENIMIENTO', label: 'Mantenimiento', color: '#9C27B0' },
    { value: 'EXCLUSIVO', label: 'Exclusivo', color: '#2196F3' }
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Filtros del Calendario</ThemedText>
        <View style={styles.headerActions}>
          {getActiveFiltersCount() > 0 && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <ThemedText style={[styles.clearText, { color: tintColor }]}>
                Limpiar
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Laboratorios */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Laboratorios</ThemedText>
          {loading ? (
            <ThemedText style={styles.loadingText}>Cargando laboratorios...</ThemedText>
          ) : (
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  !filters.lab_id && styles.optionItemSelected
                ]}
                onPress={() => handleLabSelect('')}
              >
                <Ionicons
                  name={!filters.lab_id ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={!filters.lab_id ? tintColor : iconColor}
                />
                <ThemedText style={[
                  styles.optionText,
                  !filters.lab_id && styles.optionTextSelected
                ]}>
                  Todos los laboratorios
                </ThemedText>
              </TouchableOpacity>

              {labs.map((lab) => (
                <TouchableOpacity
                  key={lab.id}
                  style={[
                    styles.optionItem,
                    filters.lab_id === lab.id && styles.optionItemSelected
                  ]}
                  onPress={() => handleLabSelect(lab.id)}
                >
                  <Ionicons
                    name={filters.lab_id === lab.id ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={filters.lab_id === lab.id ? tintColor : iconColor}
                  />
                  <ThemedText style={[
                    styles.optionText,
                    filters.lab_id === lab.id && styles.optionTextSelected
                  ]}>
                    {lab.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recursos */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recursos</ThemedText>
          {loading ? (
            <ThemedText style={styles.loadingText}>Cargando recursos...</ThemedText>
          ) : (
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  !filters.resource_id && styles.optionItemSelected
                ]}
                onPress={() => handleResourceSelect('')}
              >
                <Ionicons
                  name={!filters.resource_id ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={!filters.resource_id ? tintColor : iconColor}
                />
                <ThemedText style={[
                  styles.optionText,
                  !filters.resource_id && styles.optionTextSelected
                ]}>
                  Todos los recursos
                </ThemedText>
              </TouchableOpacity>

              {resources.map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={[
                    styles.optionItem,
                    filters.resource_id === resource.id && styles.optionItemSelected
                  ]}
                  onPress={() => handleResourceSelect(resource.id)}
                >
                  <Ionicons
                    name={filters.resource_id === resource.id ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={filters.resource_id === resource.id ? tintColor : iconColor}
                  />
                  <ThemedText style={[
                    styles.optionText,
                    filters.resource_id === resource.id && styles.optionTextSelected
                  ]}>
                    {resource.name} ({resource.type})
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Estados */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Estado</ThemedText>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                !filters.status && styles.optionItemSelected
              ]}
              onPress={() => handleStatusSelect('')}
            >
              <Ionicons
                name={!filters.status ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={!filters.status ? tintColor : iconColor}
              />
              <ThemedText style={[
                styles.optionText,
                !filters.status && styles.optionTextSelected
              ]}>
                Todos los estados
              </ThemedText>
            </TouchableOpacity>

            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.optionItem,
                  filters.status === status.value && styles.optionItemSelected
                ]}
                onPress={() => handleStatusSelect(status.value)}
              >
                <Ionicons
                  name={filters.status === status.value ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={filters.status === status.value ? tintColor : iconColor}
                />
                <View style={styles.statusOption}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <ThemedText style={[
                    styles.optionText,
                    filters.status === status.value && styles.optionTextSelected
                  ]}>
                    {status.label}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 20,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});
