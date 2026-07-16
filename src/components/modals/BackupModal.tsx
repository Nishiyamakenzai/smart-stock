"use client";
import { useState, useEffect, useCallback } from "react";
import type { BackupSnapshot } from "@/lib/types";

interface Props {
  onRestore: (snap: BackupSnapshot) => void;
  onTakeSnapshot: () => BackupSnapshot | null;
  onClose: () => void;
}

const fmtTs = (ts: number): string => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const countItems = (snap: BackupSnapshot): string => {
  const p = snap.data.projects?.length ?? 0;
  return `案件 ${p}件`;
};

export default function BackupModal({ onRestore, onTakeSnapshot, onClose }: Props) {
  const [snaps, setSnaps] = useState<BackupSnapshot[]>([]);

  const refresh = useCallback(() => {
    try {
      setSnaps(JSON.parse(localStorage.getItem("mq-snapshots") || "[]"));
    } catch {
      setSnaps([]);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleManual = () => {
    onTakeSnapshot();
    refresh();
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(15,23,42,.6)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }} onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:16, width:"100%", maxWidth:480,
        boxShadow:"0 24px 48px rgba(0,0,0,.18)",
        maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0f172a" }}>バックアップ管理</h2>
            <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748b" }}>
              データは変更のたびに自動保存され、30分ごとにローカルにスナップショットを保存します
            </p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:20, lineHeight:1, padding:4 }}>✕</button>
        </div>

        {/* Manual snapshot button */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #e2e8f0" }}>
          <button
            onClick={handleManual}
            style={{
              width:"100%", padding:"10px", background:"#3b82f6", color:"#fff",
              border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer",
            }}
          >
            今すぐスナップショットを保存
          </button>
        </div>

        {/* Snapshot list */}
        <div style={{ flex:1, overflowY:"auto", padding:"12px 20px 20px" }}>
          {snaps.length === 0 ? (
            <div style={{ textAlign:"center", color:"#94a3b8", fontSize:13, padding:"32px 0" }}>
              スナップショットがありません
            </div>
          ) : (
            <>
              <p style={{ margin:"0 0 10px", fontSize:11, color:"#94a3b8", fontWeight:600 }}>
                最新10件 — 復元するとDB上のデータが上書きされます
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {snaps.map((snap, i) => (
                  <div key={snap.ts} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 14px", borderRadius:10,
                    background: i === 0 ? "#f0fdf4" : "#f8fafc",
                    border:`1px solid ${i === 0 ? "#bbf7d0" : "#e2e8f0"}`,
                  }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>
                        {fmtTs(snap.ts)}
                        {i === 0 && <span style={{ marginLeft:8, fontSize:10, color:"#16a34a", fontWeight:700, background:"#dcfce7", padding:"1px 6px", borderRadius:99 }}>最新</span>}
                      </div>
                      <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{countItems(snap)}</div>
                    </div>
                    <button
                      onClick={() => onRestore(snap)}
                      style={{
                        padding:"6px 14px", background:"#fff",
                        border:"1px solid #e2e8f0", borderRadius:8,
                        fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer",
                      }}
                    >
                      復元
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
