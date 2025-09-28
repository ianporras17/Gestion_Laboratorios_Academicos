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
import { ResourceService } from '@/services/resourceService';
import { ResourceCard } from '@/components/resource-catalog/ResourceCard';
import { ResourceFilters } from '@/components/resource-catalog/ResourceFilters';

interface Resource {
  id: string;
  name: string;
  type: string;
  description?: string;
  inventory_code?: string;
  state: 'DISPONIBLE' | 'RESERVADO' | 'EN_MANTENIMIENTO' | 'INACTIVO';
  location?: string;
  last_maintenance?: string;
  tech_sheet?: string;
  is_public: boolean;
  requires_approval: boolean;
  max_loan_days?: number;
  daily_rate?: number;
  lab_id: string;
  lab_name: string;
  lab_location?: string;
  technical_sheet?: string;
  specifications?: any;
  qty_available?: number;
  unit?: string;
  reorder_point?: number;
  primary_photo_url?: string;
  photo_caption?: string;
}

interface Filters {
  search: string;
  lab_id?: string;
  type?: string;
  state?: string;
  is_public?: boolean;
}

export default function ResourceCatalogScreen() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    is_public: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadResources(true);
  }, [filters]);

  const loadResources = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setResources([]);
      }
      
      setLoading(true);
      const response = await ResourceService.getResources({
        ...filters,
        page: reset ? 1 : page,
        limit: 20
      });
      
      if (response.success) {
        if (reset) {
          setResources(response.data);
        } else {
          setResources(prev => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.page < response.pagination.pages);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los recursos');
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      Alert.alert('Error', 'Error al cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources(true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      await loadResources(false);
    }
  };

  const handleSearch = (text: string) => {
    setFilters(prev => ({ ...prev, search: text }));
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResourcePress = (resource: Resource) => {
    router.push(`/resource-catalog/${resource.id}`);
  };

  const handleRequestResource = (resource: Resource) => {
    router.push(`/resource-catalog/${resource.id}/request`);
  };

  const renderResourceItem = ({ item }: { item: Resource }) => (
    <ResourceCard
      resource={item}
      onPress={() => handleResourcePress(item)}
      onRequest={() => handleRequestResource(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color={tintColor} />
      <ThemedText style={styles.emptyTitle}>No hay recursos</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {filters.search ? 'No se encontraron recursos con los criterios de búsqueda' : 'Aún no se han registrado recursos'}
      </ThemedText>
    </View>
  );

  const renderFooter = () => {
    if (!loading || resources.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={tintColor} />
        <ThemedText style={styles.footerText}>Cargando más recursos...</ThemedText>
      </View>
    );
  };

  if (loading && resources.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Cargando recursos...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.title}>Catálogo de Recursos</ThemedText>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={textColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Buscar recursos..."
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
          <ResourceFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}
      </View>

      {/* Resources List */}
      <FlatList
        data={resources}
        renderItem={renderResourceItem}
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
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.7,
  },
});
