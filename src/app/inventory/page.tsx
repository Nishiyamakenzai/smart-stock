"use client";
import { useState, useEffect } from "react";
import InventoryDashboard from "@/components/inventory/InventoryDashboard";

export default function InventoryPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then(r => r.json())
      .then(d => setLoggedIn(d.loggedIn === true))
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return (
      <div style={{ minHeight:"100vh", background:"#f0f4f8", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #e2e8f0", borderTopColor:"#3b82f6", animation:"spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div style={{ minHeight:"100vh", background:"#f0f4f8", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:40 }}>🔒</div>
        <p style={{ fontWeight:700, color:"#0f172a" }}>ログインが必要です</p>
        <a href="/" style={{ padding:"10px 24px", background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", color:"#fff", borderRadius:10, fontWeight:700, fontSize:13, textDecoration:"none" }}>
          ログインページへ
        </a>
      </div>
    );
  }

  return <InventoryDashboard />;
}
