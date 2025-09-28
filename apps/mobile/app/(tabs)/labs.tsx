import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LabCard } from '@/components/labs/LabCard';
import { LabFilters } from '@/components/labs/LabFilters';
import { LabService } from '@/services/labService';

interface Lab {
  id: string;
  name: string;
  internal_code: string;
  location: string;
  description?: string;
  email_contact: string;
  capacity_max?: number;
  is_active: boolean;
  school_department_name?: string;
  responsible_count: number;
  resource_count: number;
  created_at: string;
  updated_at: string;
}

interface Filters {
  search: string;
  school_dept_id?: string;
  is_active?: boolean;
}

export default function LabsScreen() {
  const router = useRouter();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    is_active: true,
  });
  const [showFilters, setShowFilters] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadLabs();
  }, [filters]);

  const loadLabs = async () => {
    try {
      setLoading(true);
      const response = await LabService.getLabs(filters);
      if (response.success) {
        setLabs(response.data);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los laboratorios');
      }
    } catch (error) {
      console.error('Error loading labs:', error);
      Alert.alert('Error', 'Error al cargar los laboratorios');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLabs();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setFilters(prev => ({ ...prev, search: text }));
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleLabPress = (lab: Lab) => {
    router.push(`/labs/${lab.id}`);
  };

  const handleCreateLab = () => {
    router.push('/labs/create');
  };

  const renderLabItem = ({ item }: { item: Lab }) => (
    <LabCard
      lab={item}
      onPress={() => handleLabPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="flask-outline" size={64} color={tintColor} />
      <ThemedText style={styles.emptyTitle}>No hay laboratorios</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {filters.search ? 'No se encontraron laboratorios con los criterios de búsqueda' : 'Aún no se han registrado laboratorios'}
      </ThemedText>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Cargando laboratorios...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.title}>Laboratorios</ThemedText>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateLab}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={textColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Buscar laboratorios..."
            placeholderTextColor={textColor + '80'}
            value={filters.search}
            onChangeText={handleSearch}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color={tintColor} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <LabFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}
      </View>

      {/* Labs List */}
      <FlatList
        data={labs}
        renderItem={renderLabItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  filterButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 32,
  },
});
