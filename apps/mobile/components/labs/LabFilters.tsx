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
import { SchoolDepartmentService } from '@/services/schoolDepartmentService';

interface SchoolDepartment {
  id: string;
  name: string;
  email_domain: string;
  description?: string;
  is_active: boolean;
}

interface Filters {
  search: string;
  school_dept_id?: string;
  is_active?: boolean;
}

interface LabFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onClose: () => void;
}

export function LabFilters({ filters, onFilterChange, onClose }: LabFiltersProps) {
  const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await SchoolDepartmentService.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = (departmentId: string) => {
    onFilterChange({
      school_dept_id: filters.school_dept_id === departmentId ? undefined : departmentId
    });
  };

  const handleActiveToggle = (value: boolean) => {
    onFilterChange({ is_active: value });
  };

  const clearFilters = () => {
    onFilterChange({
      school_dept_id: undefined,
      is_active: true,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.school_dept_id) count++;
    if (filters.is_active !== undefined && filters.is_active !== true) count++;
    return count;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Filtros</ThemedText>
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
        {/* Estado */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Estado</ThemedText>
          <View style={styles.switchContainer}>
            <ThemedText style={styles.switchLabel}>Solo activos</ThemedText>
            <Switch
              value={filters.is_active ?? true}
              onValueChange={handleActiveToggle}
              trackColor={{ false: '#767577', true: tintColor + '40' }}
              thumbColor={filters.is_active ? tintColor : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Departamentos */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Departamento</ThemedText>
          {loading ? (
            <ThemedText style={styles.loadingText}>Cargando departamentos...</ThemedText>
          ) : (
            <View style={styles.departmentsList}>
              <TouchableOpacity
                style={[
                  styles.departmentItem,
                  !filters.school_dept_id && styles.departmentItemSelected
                ]}
                onPress={() => handleDepartmentSelect('')}
              >
                <Ionicons
                  name={!filters.school_dept_id ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={!filters.school_dept_id ? tintColor : iconColor}
                />
                <ThemedText style={[
                  styles.departmentText,
                  !filters.school_dept_id && styles.departmentTextSelected
                ]}>
                  Todos los departamentos
                </ThemedText>
              </TouchableOpacity>

              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.departmentItem,
                    filters.school_dept_id === dept.id && styles.departmentItemSelected
                  ]}
                  onPress={() => handleDepartmentSelect(dept.id)}
                >
                  <Ionicons
                    name={filters.school_dept_id === dept.id ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={filters.school_dept_id === dept.id ? tintColor : iconColor}
                  />
                  <ThemedText style={[
                    styles.departmentText,
                    filters.school_dept_id === dept.id && styles.departmentTextSelected
                  ]}>
                    {dept.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    maxHeight: 300,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 20,
  },
  departmentsList: {
    gap: 8,
  },
  departmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  departmentItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  departmentText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  departmentTextSelected: {
    fontWeight: '500',
  },
});
