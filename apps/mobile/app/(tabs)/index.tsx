import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import axios from "axios";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function Home() {
  const [msg, setMsg] = useState<string>("(sin datos)");
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");

  async function ping() {
    setStatus("loading");
    try {
      const { data } = await axios.get(`${BASE}/hello`);
      setMsg(typeof data === "object" ? JSON.stringify(data) : String(data));
      setStatus("ok");
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
      setStatus("err");
    }
  }

  useEffect(() => { ping(); }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>Conexión con API</Text>

      <Text style={s.label}>API_URL</Text>
      <Text selectable style={s.code}>{BASE || "(vacía)"}</Text>

      <Text style={s.label}>Respuesta</Text>
      <Text selectable style={[s.code, status==="err" && { color: "#ff8a8a" }]}>
        {msg}
      </Text>

      <Pressable onPress={ping} style={s.btn}>
        <Text style={s.btnText}>PROBAR DE NUEVO</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 16, gap: 12, justifyContent: "center" },
  title: { color: "#fff", fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  label: { color: "#9bb3ff", fontWeight: "600", marginTop: 8 },
  code: { color: "#fff" },
  btn: { alignSelf: "center", marginTop: 16, backgroundColor: "#2d6cdf", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18 },
  btnText: { color: "#fff", fontWeight: "700" }
});
