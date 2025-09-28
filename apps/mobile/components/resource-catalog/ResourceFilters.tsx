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

interface Lab {
  id: string;
  name: string;
  internal_code: string;
}

interface Filters {
  search: string;
  lab_id?: string;
  type?: string;
  state?: string;
  is_public?: boolean;
}

interface ResourceFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onClose: () => void;
}

export function ResourceFilters({ filters, onFilterChange, onClose }: ResourceFiltersProps) {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    try {
      setLoading(true);
      const response = await LabService.getLabs({ is_active: true });
      if (response.success) {
        setLabs(response.data);
      }
    } catch (error) {
      console.error('Error loading labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabSelect = (labId: string) => {
    onFilterChange({
      lab_id: filters.lab_id === labId ? undefined : labId
    });
  };

  const handleTypeSelect = (type: string) => {
    onFilterChange({
      type: filters.type === type ? undefined : type
    });
  };

  const handleStateSelect = (state: string) => {
    onFilterChange({
      state: filters.state === state ? undefined : state
    });
  };

  const handlePublicToggle = (value: boolean) => {
    onFilterChange({ is_public: value });
  };

  const clearFilters = () => {
    onFilterChange({
      lab_id: undefined,
      type: undefined,
      state: undefined,
      is_public: true,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.lab_id) count++;
    if (filters.type) count++;
    if (filters.state) count++;
    if (filters.is_public !== undefined && filters.is_public !== true) count++;
    return count;
  };

  const typeOptions = [
    { value: 'EQUIPMENT', label: 'Equipos', icon: 'hardware-chip-outline', color: '#2196F3' },
    { value: 'CONSUMABLE', label: 'Consumibles', icon: 'cube-outline', color: '#4CAF50' },
    { value: 'SOFTWARE', label: 'Software', icon: 'laptop-outline', color: '#FF9800' }
  ];

  const stateOptions = [
    { value: 'DISPONIBLE', label: 'Disponible', color: '#4CAF50' },
    { value: 'RESERVADO', label: 'Reservado', color: '#FF9800' },
    { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento', color: '#9C27B0' },
    { value: 'INACTIVO', label: 'Inactivo', color: '#F44336' }
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Filtros de Recursos</ThemedText>
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
          <ThemedText style={styles.sectionTitle}>Laboratorio</ThemedText>
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

        {/* Tipo */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tipo de Recurso</ThemedText>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                !filters.type && styles.optionItemSelected
              ]}
              onPress={() => handleTypeSelect('')}
            >
              <Ionicons
                name={!filters.type ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={!filters.type ? tintColor : iconColor}
              />
              <ThemedText style={[
                styles.optionText,
                !filters.type && styles.optionTextSelected
              ]}>
                Todos los tipos
              </ThemedText>
            </TouchableOpacity>

            {typeOptions.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionItem,
                  filters.type === type.value && styles.optionItemSelected
                ]}
                onPress={() => handleTypeSelect(type.value)}
              >
                <Ionicons
                  name={filters.type === type.value ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={filters.type === type.value ? tintColor : iconColor}
                />
                <View style={styles.typeOption}>
                  <Ionicons name={type.icon as any} size={16} color={type.color} />
                  <ThemedText style={[
                    styles.optionText,
                    filters.type === type.value && styles.optionTextSelected
                  ]}>
                    {type.label}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estado */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Estado</ThemedText>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[
                styles.optionItem,
                !filters.state && styles.optionItemSelected
              ]}
              onPress={() => handleStateSelect('')}
            >
              <Ionicons
                name={!filters.state ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={!filters.state ? tintColor : iconColor}
              />
              <ThemedText style={[
                styles.optionText,
                !filters.state && styles.optionTextSelected
              ]}>
                Todos los estados
              </ThemedText>
            </TouchableOpacity>

            {stateOptions.map((state) => (
              <TouchableOpacity
                key={state.value}
                style={[
                  styles.optionItem,
                  filters.state === state.value && styles.optionItemSelected
                ]}
                onPress={() => handleStateSelect(state.value)}
              >
                <Ionicons
                  name={filters.state === state.value ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={filters.state === state.value ? tintColor : iconColor}
                />
                <View style={styles.stateOption}>
                  <View style={[styles.stateDot, { backgroundColor: state.color }]} />
                  <ThemedText style={[
                    styles.optionText,
                    filters.state === state.value && styles.optionTextSelected
                  ]}>
                    {state.label}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Público */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Visibilidad</ThemedText>
          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchLabel}>Solo recursos públicos</ThemedText>
            <Switch
              value={filters.is_public ?? true}
              onValueChange={handlePublicToggle}
              trackColor={{ false: '#767577', true: tintColor + '40' }}
              thumbColor={filters.is_public ? tintColor : '#f4f3f4'}
            />
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
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
});
