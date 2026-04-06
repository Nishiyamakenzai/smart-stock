"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "./Header";
import DashTab from "./tabs/DashTab";
import ProjectsTab from "./tabs/ProjectsTab";
import MonthTab from "./tabs/MonthTab";
import AnalysisTab from "./tabs/AnalysisTab";
import BSTab from "./tabs/BSTab";
import ProjectModal from "./modals/ProjectModal";
import FixedModal from "./modals/FixedModal";
import TargetModal from "./modals/TargetModal";
import BSModal from "./modals/BSModal";
import { DEMO_PROJECTS, DEMO_MF, DEFAULT_AB, DEFAULT_TARGETS, DEFAULT_BS, migrateMF, migrateAB } from "@/lib/data";
import { computeData, aiOverall } from "@/lib/utils";
import type { Project, MonthlyFixed, AnnualBudget, Targets, BSData } from "@/lib/types";

type Tab = "dash" | "proj" | "month" | "analysis" | "bs";
const TABS: [Tab, string][] = [["dash","総合"], ["proj","案件"], ["month","月次"], ["analysis","分析"], ["bs","B/S"]];

export default function MQDashboard({ onLogout }: { onLogout: () => void }) {
  // データ状態（初期値はデモデータ、マウント後にAPIから上書き）
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [mf, setMf] = useState<MonthlyFixed>(DEMO_MF);
  const [ab, setAb] = useState<AnnualBudget>(DEFAULT_AB);
  const [targets, setTargets] = useState<Targets>(DEFAULT_TARGETS);
  const [bs, setBs] = useState<BSData>(DEFAULT_BS);
  const [dataLoaded, setDataLoaded] = useState(false);

  // UI状態
  const [tab, setTab] = useState<Tab>("dash");
  const [showPM, setShowPM] = useState(false);
  const [editP, setEditP] = useState<Project | null>(null);
  const [showFM, setShowFM] = useState(false);
  const [showTM, setShowTM] = useState(false);
  const [showBM, setShowBM] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

  // ── データ読み込み（マウント時に1回だけ） ──────────────────
  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        if (d["mq-projects"]) setProjects(d["mq-projects"]);
        if (d["mq-mf"])       setMf(migrateMF(d["mq-mf"]));
        if (d["mq-ab"])       setAb(migrateAB(d["mq-ab"]));
        if (d["mq-targets"])  setTargets(d["mq-targets"]);
        if (d["mq-bs"])       setBs(d["mq-bs"]);
      })
      .catch(console.error)
      .finally(() => setDataLoaded(true));
  }, []);

  // ── デバウンス自動保存（変更から1.5秒後にAPI保存） ────────
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const debouncedSave = useCallback((key: string, value: unknown) => {
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      }).catch(console.error);
    }, 1500);
  }, []);

  // データ読み込み後のみ保存を有効化（初期値でDBを上書きしない）
  useEffect(() => { if (dataLoaded) debouncedSave("mq-projects", projects); }, [projects, dataLoaded, debouncedSave]);
  useEffect(() => { if (dataLoaded) debouncedSave("mq-mf", mf); },           [mf, dataLoaded, debouncedSave]);
  useEffect(() => { if (dataLoaded) debouncedSave("mq-ab", ab); },            [ab, dataLoaded, debouncedSave]);
  useEffect(() => { if (dataLoaded) debouncedSave("mq-targets", targets); },  [targets, dataLoaded, debouncedSave]);
  useEffect(() => { if (dataLoaded) debouncedSave("mq-bs", bs); },            [bs, dataLoaded, debouncedSave]);

  // ── 計算 ──────────────────────────────────────────────────
  const comp = useMemo(() => computeData(projects, mf), [projects, mf]);
  const aiHints = useMemo(() => aiOverall(comp, targets), [comp, targets]);

  const handleSaveProject = (p: Project) => {
    if (editP) setProjects(prev => prev.map(x => x.id===editP.id ? {...p,id:editP.id} : x));
    else { const newId = Math.max(0,...projects.map(x=>x.id))+1; setProjects(prev => [...prev,{...p,id:newId}]); }
  };

  // ── データ読み込み中のスピナー ───────────────────────────
  if (!dataLoaded) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f0f4f8",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4f8" }}>
      <Header comp={comp} targets={targets}
        onOpenTargets={() => setShowTM(true)}
        onOpenBS={() => setShowBM(true)}
        onLogout={onLogout}/>

      <div style={{ position:"sticky", top:0, zIndex:100, background:"#ffffff", borderBottom:"1px solid #e2e8f0", boxShadow:"0 1px 4px rgba(15,23,42,.06)" }}>
        <div style={{ display:"flex", padding:"0 16px", overflowX:"auto" }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`tab-btn${tab===id?" active":""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"14px 16px", maxWidth:800, margin:"0 auto" }}>
        {tab==="dash"     && <DashTab comp={comp} targets={targets} aiHints={aiHints} onOpenFixed={() => setShowFM(true)}/>}
        {tab==="proj"     && <ProjectsTab projects={projects} filterMonth={filterMonth} onFilterMonth={setFilterMonth} onNewProject={() => { setEditP(null); setShowPM(true); }} onEditProject={p => { setEditP(p); setShowPM(true); }}/>}
        {tab==="month"    && <MonthTab comp={comp} selectedMonth={filterMonth} onSelectMonth={setFilterMonth}/>}
        {tab==="analysis" && <AnalysisTab comp={comp} targets={targets} projects={projects}/>}
        {tab==="bs"       && <BSTab bs={bs} onEdit={() => setShowBM(true)}/>}
      </div>

      {showPM && <ProjectModal project={editP} onSave={handleSaveProject} onClose={() => { setShowPM(false); setEditP(null); }} onDelete={editP ? id => setProjects(prev => prev.filter(p=>p.id!==id)) : undefined}/>}
      {showFM && <FixedModal mfData={mf} abData={ab} onSave={(f2,b2) => { setMf(f2); setAb(b2); }} onClose={() => setShowFM(false)}/>}
      {showTM && <TargetModal targets={targets} onSave={setTargets} onClose={() => setShowTM(false)}/>}
      {showBM && <BSModal bs={bs} onSave={setBs} onClose={() => setShowBM(false)}/>}
    </div>
  );
}
