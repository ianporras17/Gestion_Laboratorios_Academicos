import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { 
  LabsAPI, 
  SchoolsAPI, 
  LabResponsiblesAPI, 
  ResourcesAPI, 
  LabPoliciesAPI, 
  LabScheduleAPI, 
  LabHistoryAPI,
  LabValidations 
} from "@/services/labs";
import { Lab, SchoolDepartment, LabResponsible, Resource, LabPolicy, LabSchedule, LabHistory } from "@/types/lab";

/**
 * Módulo 1.1 – Gestión de Perfiles de Laboratorio (React Native + TypeScript)
 * 
 * Ventana completa basada en las tablas SQL:
 *  - Listado + crear/editar laboratorio (perfil con campos obligatorios y correo institucional)
 *  - Tabs: Responsables, Recursos, Políticas, Horario, Historial
 *  - Validaciones básicas, modales, y helpers de API
 */

// ----------------------------- Utils -----------------------------
const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

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
  <View style={[styles.pill, { backgroundColor: color === "green" ? "#4CAF50" : color === "red" ? "#F44336" : "#2196F3" }]}>
    <Text style={styles.pillText}>{children}</Text>
  </View>
);

const Picker: any = ({ selectedValue, onValueChange, style, children }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Array<{ label: string; value: any }>>([]);
  
  useEffect(() => {
    const pickerItems: Array<{ label: string; value: any }> = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === PickerItem) {
        pickerItems.push({ label: (child.props as any).label, value: (child.props as any).value });
      }
    });
    setItems(pickerItems);
  }, [children]);
  
  const selectedItem = items.find(item => item.value === selectedValue);
  
  return (
    <View style={style}>
      <TouchableOpacity 
        style={styles.pickerButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.pickerText}>
          {selectedItem ? selectedItem.label : "Seleccionar..."}
        </Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.pickerDropdown}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.pickerItem,
                item.value === selectedValue && styles.pickerItemSelected
              ]}
              onPress={() => {
                onValueChange(item.value);
                setIsOpen(false);
              }}
            >
              <Text style={[
                styles.pickerItemText,
                item.value === selectedValue && styles.pickerItemTextSelected
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const PickerItem: React.FC<{ label: string; value: any }> = () => null;

// Asignar PickerItem como propiedad estática de Picker
Picker.Item = PickerItem;

// ----------------------------- Listado de Laboratorios -----------------------------
const LabsList: React.FC<{ onSelect: (lab: Lab) => void; onCreate: () => void }> = ({ onSelect, onCreate }) => {
  const [data, setData] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [schools, setSchools] = useState<SchoolDepartment[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | undefined>();

  useEffect(() => { 
    setLoading(true); 
    LabsAPI.list(q, selectedSchool).then(setData).finally(() => setLoading(false)); 
  }, [q, selectedSchool]);

  useEffect(() => {
    SchoolsAPI.list().then(setSchools);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Laboratorios</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Buscar por nombre/código"
            placeholderTextColor="#666"
          />
          <Button onPress={onCreate} style={styles.newButton}>
            <Text style={styles.buttonText}>+ Nuevo</Text>
          </Button>
        </View>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Escuela:</Text>
          <Picker
            selectedValue={selectedSchool}
            onValueChange={(value: number | undefined) => setSelectedSchool(value)}
            style={styles.picker}
          >
            <Picker.Item label="Todas las escuelas" value={undefined} />
            {schools.map(school => (
              <Picker.Item key={school.id} label={school.name} value={school.id} />
            ))}
          </Picker>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando…</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {data.map(lab => (
            <TouchableOpacity 
              key={lab.id} 
              style={styles.labItem}
              onPress={() => onSelect(lab)}
            >
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.labCode}>{lab.internal_code}</Text>
              <Text style={styles.labSchool}>{lab.school_name || "—"}</Text>
              <Text style={styles.labLocation}>{lab.location}</Text>
              <Text style={styles.labEmail}>{lab.email_contact}</Text>
              <Text style={styles.labCapacity}>Cap: {lab.capacity_max ?? 0}</Text>
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
  onSaved: (saved: Lab) => void 
}> = ({ value, onCancel, onSaved }) => {
  const [v, setV] = useState<Partial<Lab>>({ capacity_max: 0, ...value });
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<SchoolDepartment[]>([]);
  
  const invalid = useMemo(() => 
    LabValidations.validateLab(v).length > 0, 
    [v]
  );

  useEffect(() => {
    SchoolsAPI.list().then(setSchools);
  }, []);

  const save = async () => {
    setSaving(true);
    const payload: Partial<Lab> = {
      name: v.name?.trim(),
      internal_code: v.internal_code?.trim(),
      school_dept_id: v.school_dept_id,
      location: v.location?.trim(),
      description: v.description?.trim?.(),
      email_contact: v.email_contact?.trim(),
      capacity_max: Number(v.capacity_max || 0),
    };
    
    try {
      const saved = value?.id 
        ? await LabsAPI.update(value.id!, payload) 
        : await LabsAPI.create(payload);
      onSaved(saved);
    } catch (e: any) {
      Alert.alert("Error", "Error guardando: " + (e?.response?.data?.message || e.message));
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <ScrollView style={styles.formContainer}>
      <Field label="Nombre" required>
        <TextInput
          style={styles.input}
          value={v.name || ""}
          onChangeText={(text) => setV({ ...v, name: text })}
          placeholder="Nombre del laboratorio"
        />
      </Field>
      
      <Field label="Código interno" required>
        <TextInput
          style={styles.input}
          value={v.internal_code || ""}
          onChangeText={(text) => setV({ ...v, internal_code: text })}
          placeholder="Código interno"
        />
      </Field>
      
      <Field label="Escuela / Departamento" required>
        <Picker
          selectedValue={v.school_dept_id}
          onValueChange={(value: number | undefined) => setV({ ...v, school_dept_id: value })}
          style={styles.picker}
        >
          <Picker.Item label="Seleccionar escuela" value={undefined} />
          {schools.map(school => (
            <Picker.Item key={school.id} label={school.name} value={school.id} />
          ))}
        </Picker>
      </Field>
      
      <Field label="Ubicación" required>
        <TextInput
          style={styles.input}
          value={v.location || ""}
          onChangeText={(text) => setV({ ...v, location: text })}
          placeholder="Ubicación física"
        />
      </Field>
      
      <Field label="Descripción de áreas">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={v.description || ""}
          onChangeText={(text) => setV({ ...v, description: text })}
          placeholder="Descripción de las áreas del laboratorio"
          multiline
          numberOfLines={3}
        />
      </Field>
      
      <Field label="Correo institucional" required>
        <TextInput
          style={[
            styles.input, 
            v.email_contact && !LabValidations.isTecEmail(v.email_contact) && styles.inputError
          ]}
          value={v.email_contact || ""}
          onChangeText={(text) => setV({ ...v, email_contact: text })}
          placeholder="labXXXX@tec.ac.cr"
          keyboardType="email-address"
        />
      </Field>
      
      <Field label="Capacidad máxima">
        <TextInput
          style={styles.input}
          value={String(v.capacity_max ?? 0)}
          onChangeText={(text) => setV({ ...v, capacity_max: Number(text) })}
          placeholder="0"
          keyboardType="numeric"
        />
      </Field>
      
      <View style={styles.buttonContainer}>
        <Button onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </Button>
        <Button 
          onPress={save} 
          style={[
            styles.saveButton,
            (invalid || saving) && styles.disabledButton
          ]}
          disabled={invalid || saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Guardando…" : (value?.id ? "Guardar cambios" : "Crear laboratorio")}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
};

// ----------------------------- Tabs: Responsables -----------------------------
const ResponsiblesTab: React.FC<{ labId: number }> = ({ labId }) => {
  const [items, setItems] = useState<LabResponsible[]>([]);
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Partial<LabResponsible>>({ is_primary: false });
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    LabResponsiblesAPI.list(labId).then(setItems).finally(() => setLoading(false));
  };

  useEffect(load, [labId]);

  const save = async () => { 
    try { 
      if (v.id) {
        await LabResponsiblesAPI.update(labId, v.id, v);
      } else {
        await LabResponsiblesAPI.create(labId, v);
      }
      setOpen(false); 
      setV({ is_primary: false }); 
      load(); 
    } catch(e: any) { 
      Alert.alert("Error", e?.response?.data?.message || e.message);
    } 
  };

  const remove = async (id: number) => { 
    Alert.alert("Confirmar", "¿Eliminar responsable?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", onPress: async () => {
        try {
          await LabResponsiblesAPI.delete(labId, id);
          load();
        } catch (e: any) {
          Alert.alert("Error", e?.response?.data?.message || e.message);
        }
      }}
    ]);
  };

  return (
    <View>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Responsables y contactos</Text>
        <Button onPress={() => { setV({ is_primary: false }); setOpen(true); }}>
          <Text style={styles.buttonText}>+ Agregar</Text>
        </Button>
      </View>
      
      {loading ? (
        <Text style={styles.loadingText}>Cargando…</Text>
      ) : (
        <ScrollView style={styles.tabContent}>
          {items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.full_name}</Text>
                {item.is_primary && (
                  <Pill color="green">Principal</Pill>
                )}
              </View>
              <Text style={styles.itemSubtitle}>{item.position_title}</Text>
              <Text style={styles.itemText}>📧 {item.email}</Text>
              {item.phone && <Text style={styles.itemText}>📞 {item.phone}</Text>}
              <View style={styles.itemActions}>
                <Button onPress={() => { setV(item); setOpen(true); }} style={styles.editButton}>
                  <Text style={styles.buttonText}>Editar</Text>
                </Button>
                <Button onPress={() => remove(item.id)} style={styles.deleteButton}>
                  <Text style={styles.buttonText}>Eliminar</Text>
                </Button>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={v?.id ? "Editar responsable" : "Nuevo responsable"}>
        <View style={styles.modalContent}>
          <Field label="Nombre" required>
            <TextInput
              style={styles.input}
              value={v.full_name || ""}
              onChangeText={(text) => setV({ ...v, full_name: text })}
              placeholder="Nombre completo"
            />
          </Field>
          
          <Field label="Cargo" required>
            <TextInput
              style={styles.input}
              value={v.position_title || ""}
              onChangeText={(text) => setV({ ...v, position_title: text })}
              placeholder="Encargado/Técnico"
            />
          </Field>
          
          <Field label="Teléfono">
            <TextInput
              style={styles.input}
              value={v.phone || ""}
              onChangeText={(text) => setV({ ...v, phone: text })}
              placeholder="Número de teléfono"
              keyboardType="phone-pad"
            />
          </Field>
          
          <Field label="Correo institucional" required>
            <TextInput
              style={[
                styles.input, 
                v.email && !LabValidations.isTecEmail(v.email) && styles.inputError
              ]}
              value={v.email || ""}
              onChangeText={(text) => setV({ ...v, email: text })}
              placeholder="usuario@tec.ac.cr"
              keyboardType="email-address"
            />
          </Field>
          
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setV({ ...v, is_primary: !v.is_primary })}
            >
              <Text style={styles.checkboxText}>
                {v.is_primary ? "☑️" : "☐"} Marcar como responsable principal
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button onPress={() => setOpen(false)} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </Button>
            <Button onPress={save} style={styles.saveButton}>
              <Text style={styles.buttonText}>Guardar</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ----------------------------- Página principal -----------------------------
export default function GestionPerfilesLaboratorio() {
  const [selected, setSelected] = useState<Lab | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lab | null>(null);
  const [activeTab, setActiveTab] = useState("perfil");

  const refreshAndOpenDetail = async (id: number) => { 
    const lab = await LabsAPI.get(id); 
    setSelected(lab); 
  };
  
  const onCreate = () => { 
    setEditing(null); 
    setShowForm(true); 
  };
  
  const onSelect = (lab: Lab) => { 
    setSelected(lab); 
  };
  
  const onEdit = () => { 
    setEditing(selected!); 
    setShowForm(true); 
  };
  
  const onSaved = (saved: Lab) => { 
    setShowForm(false); 
    if (saved?.id) refreshAndOpenDetail(saved.id); 
  };

  const tabs = [
    { id: "perfil", label: "Perfil" },
    { id: "responsables", label: "Responsables" },
    { id: "recursos", label: "Recursos" },
    { id: "politicas", label: "Políticas" },
    { id: "horario", label: "Horario" },
    { id: "historial", label: "Historial" },
  ];

  return (
    <View style={styles.pageContainer}>
      <View style={styles.contentContainer}>
        <View style={styles.leftPanel}>
          <LabsList onSelect={onSelect} onCreate={onCreate} />
        </View>
        
        <View style={styles.rightPanel}>
          {!selected && !showForm && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Selecciona un laboratorio del listado o crea uno nuevo.
              </Text>
            </View>
          )}
          
          {selected && !showForm && (
            <View style={styles.detailContainer}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selected.name}</Text>
                <Text style={styles.detailSubtitle}>
                  {selected.internal_code} · {selected.school_name || ""} · {selected.location}
                </Text>
                <Text style={styles.detailInfo}>
                  {selected.email_contact} · Capacidad {selected.capacity_max ?? 0}
                </Text>
                <Button onPress={onEdit} style={styles.editButton}>
                  <Text style={styles.buttonText}>Editar perfil</Text>
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
                  <View>
                    <Text style={styles.sectionTitle}>Descripción de áreas</Text>
                    <Text style={styles.descriptionText}>
                      {selected.description || "—"}
                    </Text>
                  </View>
                )}
                {activeTab === "responsables" && <ResponsiblesTab labId={selected.id} />}
                {activeTab === "recursos" && <Text>Recursos (próximamente)</Text>}
                {activeTab === "politicas" && <Text>Políticas (próximamente)</Text>}
                {activeTab === "horario" && <Text>Horario (próximamente)</Text>}
                {activeTab === "historial" && <Text>Historial (próximamente)</Text>}
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
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    padding: 16,
  },
  rightPanel: {
    flex: 2,
    padding: 16,
  },
  container: {
    backgroundColor: 'white',
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
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  newButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  picker: {
    flex: 1,
    height: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    maxHeight: 400,
  },
  labItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  labName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  labCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  labSchool: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  labLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  labEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  labCapacity: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  detailContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: 'white',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  checkboxContainer: {
    marginVertical: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalContent: {
    padding: 16,
  },
  // Estilos para componentes UI básicos
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  pickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 100,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
});
