import type { AIHint } from "@/lib/types";

const STYLES = {
  good: { bg:"#ecfdf5", border:"#a7f3d0", text:"#065f46", icon:"✦", dot:"#10b981" },
  warn: { bg:"#fffbeb", border:"#fde68a", text:"#92400e", icon:"⚠", dot:"#f59e0b" },
  bad:  { bg:"#fef2f2", border:"#fecaca", text:"#991b1b", icon:"✕", dot:"#ef4444" },
  info: { bg:"#eff6ff", border:"#bfdbfe", text:"#1e40af", icon:"→", dot:"#3b82f6" },
} as const;

export default function Badge({ type, text }: { type: AIHint["t"]; text: string }) {
  const s = STYLES[type] ?? STYLES.info;
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:10,
      padding:"10px 14px",
      background:s.bg,
      border:"1px solid "+s.border,
      borderRadius:10,
      marginBottom:6,
    }}>
      <span style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        width:20, height:20, minWidth:20,
        background:s.dot+"22",
        borderRadius:"50%",
        fontSize:10, color:s.dot, fontWeight:800,
        marginTop:1,
      }}>{s.icon}</span>
      <span style={{ fontSize:13, color:s.text, lineHeight:1.6, fontWeight:500 }}>{text}</span>
    </div>
  );
}
