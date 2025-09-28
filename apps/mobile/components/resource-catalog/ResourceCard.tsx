import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

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

interface ResourceCardProps {
  resource: Resource;
  onPress: () => void;
  onRequest: () => void;
}

const { width } = Dimensions.get('window');

export function ResourceCard({ resource, onPress, onRequest }: ResourceCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DISPONIBLE':
        return '#4CAF50';
      case 'RESERVADO':
        return '#FF9800';
      case 'EN_MANTENIMIENTO':
        return '#9C27B0';
      case 'INACTIVO':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'DISPONIBLE':
        return 'checkmark-circle-outline';
      case 'RESERVADO':
        return 'time-outline';
      case 'EN_MANTENIMIENTO':
        return 'construct-outline';
      case 'INACTIVO':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
        return 'hardware-chip-outline';
      case 'consumable':
        return 'cube-outline';
      case 'software':
        return 'laptop-outline';
      default:
        return 'cube-outline';
    }
  };

  const getTypeName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
        return 'Equipo';
      case 'consumable':
        return 'Consumible';
      case 'software':
        return 'Software';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isAvailable = resource.state === 'DISPONIBLE';
  const isLowStock = resource.qty_available !== undefined && 
                    resource.reorder_point !== undefined && 
                    resource.qty_available <= resource.reorder_point;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {resource.name}
          </ThemedText>
          <View style={styles.badgeContainer}>
            <View style={[styles.stateBadge, { 
              backgroundColor: getStateColor(resource.state) 
            }]}>
              <Text style={styles.stateText}>
                {resource.state.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>
        <ThemedText style={styles.code} numberOfLines={1}>
          {resource.inventory_code || 'Sin código'}
        </ThemedText>
      </View>

      {/* Image */}
      {resource.primary_photo_url ? (
        <Image
          source={{ uri: resource.primary_photo_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name={getTypeIcon(resource.type) as any} size={48} color={iconColor} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons name="flask-outline" size={16} color={iconColor} />
          <ThemedText style={styles.infoText} numberOfLines={1}>
            {resource.lab_name}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name={getTypeIcon(resource.type) as any} size={16} color={iconColor} />
          <ThemedText style={styles.infoText} numberOfLines={1}>
            {getTypeName(resource.type)}
          </ThemedText>
        </View>

        {resource.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={iconColor} />
            <ThemedText style={styles.infoText} numberOfLines={1}>
              {resource.location}
            </ThemedText>
          </View>
        )}

        {resource.description && (
          <ThemedText style={styles.description} numberOfLines={2}>
            {resource.description}
          </ThemedText>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          {resource.qty_available !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={16} color={tintColor} />
              <ThemedText style={[
                styles.statText,
                isLowStock && styles.lowStockText
              ]}>
                {resource.qty_available} {resource.unit || 'unidades'}
              </ThemedText>
            </View>
          )}

          {resource.max_loan_days && (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={tintColor} />
              <ThemedText style={styles.statText}>
                {resource.max_loan_days} días
              </ThemedText>
            </View>
          )}

          {resource.daily_rate && (
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={16} color={tintColor} />
              <ThemedText style={styles.statText}>
                ${resource.daily_rate}/día
              </ThemedText>
            </View>
          )}
        </View>

        {/* Alerts */}
        {isLowStock && (
          <View style={styles.alertContainer}>
            <Ionicons name="warning-outline" size={16} color="#FF9800" />
            <ThemedText style={styles.alertText}>
              Stock bajo - Punto de reorden alcanzado
            </ThemedText>
          </View>
        )}

        {resource.requires_approval && (
          <View style={styles.alertContainer}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#2196F3" />
            <ThemedText style={styles.alertText}>
              Requiere aprobación
            </ThemedText>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <ThemedText style={styles.footerText}>
            {resource.lab_name}
          </ThemedText>
        </View>
        <View style={styles.footerRight}>
          {isAvailable ? (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={onRequest}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <ThemedText style={styles.requestButtonText}>
                Solicitar
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.unavailableButton}>
              <Ionicons name="close-circle-outline" size={20} color="#F44336" />
              <ThemedText style={styles.unavailableText}>
                No disponible
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    flexShrink: 0,
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stateText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  code: {
    fontSize: 14,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.8,
  },
  lowStockText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
  },
  alertText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#856404',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
  },
  footerRight: {
    flexShrink: 0,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  unavailableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unavailableText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
  },
});
