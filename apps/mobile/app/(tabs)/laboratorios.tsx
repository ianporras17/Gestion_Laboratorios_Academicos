import React, { useEffect, useMemo, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  TextInput as RNTextInput
} from "react-native";
import { Button, Field, Modal, Pill, TextInput } from "@/components/ui";
import { LabsAPI, ContactsAPI, EquipmentAPI, ConsumablesAPI, PoliciesAPI, ScheduleAPI, ExceptionsAPI, HistoryAPI } from "@/services/labs";
import { isTecEmail, days, formatDate, formatDateTime } from "@/utils/helpers";
import type { Lab, Contact, Equipment, Consumable, Policy, Schedule, ScheduleException, History } from "@/types/lab";

// ----------------------------- Listado de Laboratorios -----------------------------
const LabsList: React.FC<{ 
  onSelect: (lab: Lab) => void; 
  onCreate: () => void;
}> = ({ onSelect, onCreate }) => {
  const [data, setData] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const labs = await LabsAPI.list(query);
      setData(labs);
    } catch (error: any) {
      Alert.alert("Error", "No se pudieron cargar los laboratorios");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Laboratorios</Text>
        <View style={styles.headerActions}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre/escuela"
            value={query}
            onChangeText={setQuery}
          />
          <Button variant="solid" onPress={onCreate}>+ Nuevo</Button>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {data.map(lab => (
            <TouchableOpacity
              key={lab.id}
              style={styles.labItem}
              onPress={() => onSelect(lab)}
            >
              <View style={styles.labHeader}>
                <Text style={styles.labName}>{lab.name}</Text>
                <Text style={styles.labCode}>{lab.internal_code}</Text>
              </View>
              <Text style={styles.labDetails}>
                {lab.school || "—"} · {lab.location}
              </Text>
              <Text style={styles.labEmail}>{lab.email_contact}</Text>
              <Text style={styles.labCapacity}>
                Capacidad: {lab.capacity_max ?? 0}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ----------------------------- Formulario de Laboratorio -----------------------------
const LabForm: React.FC<{
  value?: Partial<Lab>;
  onCancel: () => void;
  onSaved: (saved: Lab) => void;
}> = ({ value, onCancel, onSaved }) => {
  const [formData, setFormData] = useState<Partial<Lab>>({ 
    capacity_max: 0, 
    ...value 
  });
  const [saving, setSaving] = useState(false);

  const isInvalid = useMemo(() => 
    !formData?.name || 
    !formData?.internal_code || 
    !formData?.location || 
    !isTecEmail(formData?.email_contact), 
    [formData]
  );

  const save = async () => {
    setSaving(true);
    const payload: Partial<Lab> = {
      name: formData.name?.trim(),
      internal_code: formData.internal_code?.trim(),
      school: formData.school?.trim?.(),
      location: formData.location?.trim(),
      description: formData.description?.trim?.(),
      email_contact: formData.email_contact?.trim(),
      capacity_max: Number(formData.capacity_max || 0),
    };

    try {
      const saved = value?.id 
        ? await LabsAPI.update(value.id!, payload) 
        : await LabsAPI.create(payload);
      onSaved(saved);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.formContainer}>
      <Field label="Nombre" required>
        <TextInput
          value={formData.name || ""}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Nombre del laboratorio"
        />
      </Field>

      <Field label="Código interno" required>
        <TextInput
          value={formData.internal_code || ""}
          onChangeText={(text) => setFormData({ ...formData, internal_code: text })}
          placeholder="Código interno"
        />
      </Field>

      <Field label="Escuela / Departamento">
        <TextInput
          value={formData.school || ""}
          onChangeText={(text) => setFormData({ ...formData, school: text })}
          placeholder="Escuela o departamento"
        />
      </Field>

      <Field label="Ubicación" required>
        <TextInput
          value={formData.location || ""}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          placeholder="Ubicación del laboratorio"
        />
      </Field>

      <Field label="Descripción de áreas">
        <TextInput
          value={formData.description || ""}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Descripción de las áreas del laboratorio"
          multiline
          numberOfLines={3}
        />
      </Field>

      <Field label="Correo institucional" required>
        <TextInput
          error={formData.email_contact ? !isTecEmail(formData.email_contact) : false}
          value={formData.email_contact || ""}
          onChangeText={(text) => setFormData({ ...formData, email_contact: text })}
          placeholder="labXXXX@tec.ac.cr"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Capacidad máxima">
        <TextInput
          value={String(formData.capacity_max ?? 0)}
          onChangeText={(text) => setFormData({ ...formData, capacity_max: Number(text) })}
          placeholder="Capacidad máxima"
          keyboardType="numeric"
        />
      </Field>

      <View style={styles.formActions}>
        <Button onPress={onCancel}>Cancelar</Button>
        <Button 
          variant="solid" 
          disabled={isInvalid || saving} 
          onPress={save}
        >
          {saving ? "Guardando..." : (value?.id ? "Guardar cambios" : "Crear laboratorio")}
        </Button>
      </View>
    </ScrollView>
  );
};

// ----------------------------- Tabs: Contactos -----------------------------
const ContactsTab: React.FC<{ labId: number }> = ({ labId }) => {
  const [items, setItems] = useState<Contact[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({ is_primary: false });

  const loadData = async () => {
    try {
      const contacts = await ContactsAPI.list(labId);
      setItems(contacts);
    } catch (error: any) {
      Alert.alert("Error", "No se pudieron cargar los contactos");
    }
  };

  useEffect(() => {
    loadData();
  }, [labId]);

  const save = async () => {
    try {
      await ContactsAPI.upsert(labId, formData);
      setModalOpen(false);
      setFormData({ is_primary: false });
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    }
  };

  const togglePrimary = async (contact: Contact) => {
    try {
      await ContactsAPI.upsert(labId, { ...contact, is_primary: !contact.is_primary });
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    }
  };

  const remove = async (id: number) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este contacto?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await ContactsAPI.remove(labId, id);
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
    <View style={styles.tabContainer}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Responsables y contactos</Text>
        <Button 
          variant="solid" 
          onPress={() => {
            setFormData({ is_primary: false });
            setModalOpen(true);
          }}
        >
          + Agregar
        </Button>
      </View>

      <ScrollView style={styles.listContainer}>
        {items.map(item => (
          <View key={item.id} style={styles.listItem}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.full_name}</Text>
              <Text style={styles.itemSubtitle}>{item.position_title}</Text>
              <Text style={styles.itemDetails}>{item.phone}</Text>
              <Text style={styles.itemDetails}>{item.email}</Text>
              <View style={styles.itemActions}>
                <Button
                  variant={item.is_primary ? "solid" : "outline"}
                  onPress={() => togglePrimary(item)}
                  style={styles.primaryButton}
                >
                  {item.is_primary ? "Principal" : "No principal"}
                </Button>
                <View style={styles.actionButtons}>
                  <Button 
                    onPress={() => {
                      setFormData(item);
                      setModalOpen(true);
                    }}
                    style={styles.actionButton}
                  >
                    Editar
                  </Button>
                  <Button 
                    onPress={() => remove(item.id)}
                    style={styles.actionButton}
                  >
                    Eliminar
                  </Button>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={formData?.id ? "Editar contacto" : "Nuevo contacto"}
        footer={
          <View style={styles.modalFooter}>
            <Button onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="solid" onPress={save}>Guardar</Button>
          </View>
        }
      >
        <ScrollView>
          <Field label="Nombre" required>
            <TextInput
              value={formData.full_name || ""}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder="Nombre completo"
            />
          </Field>

          <Field label="Cargo">
            <TextInput
              value={formData.position_title || ""}
              onChangeText={(text) => setFormData({ ...formData, position_title: text })}
              placeholder="Cargo o posición"
            />
          </Field>

          <Field label="Teléfono">
            <TextInput
              value={formData.phone || ""}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Número de teléfono"
              keyboardType="phone-pad"
            />
          </Field>

          <Field label="Correo institucional" required>
            <TextInput
              error={formData.email ? !isTecEmail(formData.email) : false}
              value={formData.email || ""}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="correo@tec.ac.cr"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFormData({ ...formData, is_primary: !formData.is_primary })}
            >
              <Text style={styles.checkboxText}>
                {formData.is_primary ? "☑" : "☐"} Marcar como responsable principal
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

// ----------------------------- Página principal -----------------------------
export default function LaboratoriosPage() {
  const [selected, setSelected] = useState<Lab | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lab | null>(null);
  const [activeTab, setActiveTab] = useState("perfil");

  const refreshAndOpenDetail = async (id: number) => {
    try {
      const lab = await LabsAPI.get(id);
      setSelected(lab);
    } catch (error: any) {
      Alert.alert("Error", "No se pudo cargar el laboratorio");
    }
  };

  const onCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const onSelect = (lab: Lab) => {
    setSelected(lab);
    setActiveTab("perfil");
  };

  const onEdit = () => {
    setEditing(selected!);
    setShowForm(true);
  };

  const onSaved = (saved: Lab) => {
    setShowForm(false);
    if (saved?.id) {
      refreshAndOpenDetail(saved.id);
    }
  };

  const tabs = [
    { id: "perfil", label: "Perfil" },
    { id: "contactos", label: "Responsables" },
  ];

  return (
    <View style={styles.pageContainer}>
      <View style={styles.mainLayout}>
        <View style={styles.sidebar}>
          <LabsList onSelect={onSelect} onCreate={onCreate} />
        </View>
        
        <View style={styles.content}>
          {!selected && !showForm && (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                Selecciona un laboratorio del listado o crea uno nuevo.
              </Text>
            </View>
          )}
          
          {selected && !showForm && (
            <View style={styles.detailContainer}>
              <View style={styles.detailHeader}>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailTitle}>{selected.name}</Text>
                  <Text style={styles.detailSubtitle}>
                    {selected.internal_code} · {selected.school || ""} · {selected.location}
                  </Text>
                  <Text style={styles.detailSubtitle}>
                    {selected.email_contact} · Capacidad {selected.capacity_max ?? 0}
                  </Text>
                </View>
                <Button onPress={onEdit}>Editar perfil</Button>
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
                      onPress={() => setActiveTab(tab.id)}
                    >
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

              <View style={styles.tabContent}>
                {activeTab === "perfil" && (
                  <View style={styles.profileContent}>
                    <Text style={styles.profileTitle}>Descripción de áreas</Text>
                    <Text style={styles.profileDescription}>
                      {selected.description || "—"}
                    </Text>
                  </View>
                )}
                {activeTab === "contactos" && <ContactsTab labId={selected.id} />}
              </View>
            </View>
          )}
          
          {showForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {editing ? "Editar laboratorio" : "Nuevo laboratorio"}
              </Text>
              <LabForm 
                value={editing ?? undefined} 
                onCancel={() => setShowForm(false)} 
                onSaved={onSaved} 
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ----------------------------- Estilos -----------------------------
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    flex: 1,
    margin: 8,
  },
  content: {
    flex: 2,
    margin: 8,
  },
  container: {
    backgroundColor: '#ffffff',
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  headerActions: {
    gap: 8,
  },
  searchInput: {
    marginBottom: 8,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
  },
  labItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  labHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  labCode: {
    fontSize: 14,
    color: '#6b7280',
  },
  labDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  labEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  labCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  placeholder: {
    backgroundColor: '#ffffff',
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
  detailContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailInfo: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  activeTab: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    color: '#374151',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabContent: {
    padding: 16,
  },
  profileContent: {
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  profileDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  tabContainer: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: '#374151',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
});
