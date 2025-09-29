import { useEffect, useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet } from "react-native";
import axios from "axios";
import { Link, type Href, useRouter } from "expo-router";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function Home() {
  const router = useRouter();
  const go = (p: string) => router.push(p as any);

  const [msg, setMsg] = useState<string>("(sin datos)");
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");

  async function ping() {
    setStatus("loading");
    try {
      const { data } = await axios.get(`${BASE.replace(/\/api$/, "")}/api`);
      setMsg(typeof data === "object" ? JSON.stringify(data) : String(data));
      setStatus("ok");
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
      setStatus("err");
    }
  }
  useEffect(() => { ping(); }, []);

  // rutas tipadas existentes
  const toLabs    = "/labs" as Href;
  const toDepts   = "/admin/departments" as Href;
  const toTypes   = "/admin/resource-types" as Href;
  const toReqNew  = "/requests/new" as Href;
  const toReqs    = "/requests" as Href;
  const toReport1 = "/reports/usage" as Href;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container}>
      <Text style={s.title}>Conexión con API</Text>

      <Text style={s.label}>API_URL</Text>
      <Text selectable style={s.code}>{BASE || "(vacía)"}</Text>

      <Text style={s.label}>Respuesta</Text>
      <Text selectable style={[s.code, status==="err" && { color: "#ff8a8a" }]}>
        {msg}
      </Text>

      {/* ---------- Labs ---------- */}
      <Link href={toLabs} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#10b981" }]}>
          <Text style={s.btnText}>IR A LABS</Text>
        </Pressable>
      </Link>

      {/* ---------- Solicitudes ---------- */}
      <Link href={toReqNew} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#f59e0b" }]}>
          <Text style={s.btnText}>CREAR SOLICITUD</Text>
        </Pressable>
      </Link>

      <Link href={toReqs} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#2563eb" }]}>
          <Text style={s.btnText}>VER SOLICITUDES</Text>
        </Pressable>
      </Link>

      {/* ---------- Admin ---------- */}
      <Link href={toDepts} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#2d6cdf" }]}>
          <Text style={s.btnText}>ADMIN: DEPARTAMENTOS</Text>
        </Pressable>
      </Link>

      <Link href={toTypes} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#8b5cf6" }]}>
          <Text style={s.btnText}>ADMIN: TIPOS DE RECURSO</Text>
        </Pressable>
      </Link>

      {/* ---------- Reporte 1.4 (ya existente) ---------- */}
      <Link href={toReport1} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]}>
          <Text style={s.btnText}>REPORTE DE USO (1.4)</Text>
        </Pressable>
      </Link>

      {/* ---------- NUEVO: Panel Técnico (2.x) ---------- */}
      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/tech")}>
        <Text style={s.btnText}>TÉCNICO: PANEL</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#22c55e" }]} onPress={() => go("/tech/assignments")}>
        <Text style={s.btnText}>TÉCNICO: ASIGNACIONES</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/tech/approved")}>
        <Text style={s.btnText}>TÉCNICO: APROBADAS</Text>
      </Pressable>

      {/* ---------- NUEVO: Inventario (2.2) ---------- */}
      <Pressable style={[s.btn, { backgroundColor: "#f59e0b" }]} onPress={() => go("/inventory/consumables")}>
        <Text style={s.btnText}>INVENTARIO: CONSUMIBLES</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#6366f1" }]} onPress={() => go("/inventory/movements")}>
        <Text style={s.btnText}>INVENTARIO: MOVIMIENTOS</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#8b5cf6" }]} onPress={() => go("/inventory/fixed-status")}>
        <Text style={s.btnText}>INVENTARIO: ESTADO EQUIPO FIJO</Text>
      </Pressable>

      {/* ---------- NUEVO: Mantenimiento (2.3) ---------- */}
      <Pressable style={[s.btn, { backgroundColor: "#14b8a6" }]} onPress={() => go("/maintenance/orders")}>
        <Text style={s.btnText}>MANTTO: ÓRDENES</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#10b981" }]} onPress={() => go("/maintenance/orders/new")}>
        <Text style={s.btnText}>MANTTO: NUEVA ORDEN</Text>
      </Pressable>

      {/* ---------- NUEVO: Reportes operativos (2.4) ---------- */}
      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/reports")}>
        <Text style={s.btnText}>REPORTES OPERATIVOS (2.4)</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b1220" },
  container: { padding: 16, gap: 12 }, // sin justifyContent para permitir scroll natural
  title: { color: "#fff", fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  label: { color: "#9bb3ff", fontWeight: "600", marginTop: 8 },
  code: { color: "#fff" },
  btn: { alignSelf: "stretch", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, minWidth: 260, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" }
});
