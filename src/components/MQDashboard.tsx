"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "./Header";
import DashTab from "./tabs/DashTab";
import ProjectsTab from "./tabs/ProjectsTab";
import MonthTab from "./tabs/MonthTab";
import AnalysisTab from "./tabs/AnalysisTab";
import BSTab from "./tabs/BSTab";
import ShareRateTab from "./tabs/ShareRateTab";
import ProjectModal from "./modals/ProjectModal";
import FixedModal from "./modals/FixedModal";
import TargetModal from "./modals/TargetModal";
import BSModal from "./modals/BSModal";
import PrevModal from "./modals/PrevModal";
import { DEMO_PROJECTS, DEMO_MF, DEFAULT_AB, DEFAULT_TARGETS, DEFAULT_BS, DEFAULT_SHARE_RATE, PREV, PREV2, migrateMF, migrateAB } from "@/lib/data";
import { computeData, aiOverall } from "@/lib/utils";
import type { Project, MonthlyFixed, AnnualBudget, Targets, BSData, ShareRateState, PrevPeriod } from "@/lib/types";

type Tab = "dash" | "proj" | "month" | "analysis" | "bs" | "share";
const TABS: [Tab, string][] = [["dash","総合"], ["proj","案件"], ["month","月次"], ["analysis","分析"], ["bs","B/S"], ["share","シェア率"]];

export default function MQDashboard({ onLogout }: { onLogout: () => void }) {
  // データ状態（初期値はデモデータ、マウント後にAPIから上書き）
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [mf, setMf] = useState<MonthlyFixed>(DEMO_MF);
  const [ab, setAb] = useState<AnnualBudget>(DEFAULT_AB);
  const [targets, setTargets] = useState<Targets>(DEFAULT_TARGETS);
  const [bs, setBs] = useState<BSData>(DEFAULT_BS);
  const [shareRate, setShareRate] = useState<ShareRateState>(DEFAULT_SHARE_RATE);
  const [prev, setPrev] = useState<PrevPeriod>(PREV);
  const [prev2, setPrev2] = useState<PrevPeriod>(PREV2);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  // saveEnabled は DB からの正常ロード後のみ true にする（エラー時に初期デモデータを上書き保存しないための安全弁）
  const [saveEnabled, setSaveEnabled] = useState(false);

  // UI状態
  const [tab, setTab] = useState<Tab>("dash");
  const [showPM, setShowPM] = useState(false);
  const [editP, setEditP] = useState<Project | null>(null);
  const [showFM, setShowFM] = useState(false);
  const [showTM, setShowTM] = useState(false);
  const [showBM, setShowBM] = useState(false);
  const [showPrevM, setShowPrevM] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

  // ── データ読み込み（マウント時に1回だけ） ──────────────────
  const loadData = useCallback(() => {
    setDataLoaded(false);
    setLoadError(false);
    fetch("/api/data")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d["mq-projects"]) setProjects(d["mq-projects"]);
        if (d["mq-mf"])       setMf(migrateMF(d["mq-mf"]));
        if (d["mq-ab"])       setAb(migrateAB(d["mq-ab"]));
        if (d["mq-targets"])  setTargets(d["mq-targets"]);
        if (d["mq-bs"])       setBs(d["mq-bs"]);
        if (d["mq-share"])    setShareRate(d["mq-share"]);
        if (d["mq-prev"])     setPrev(d["mq-prev"]);
        if (d["mq-prev2"])    setPrev2(d["mq-prev2"]);
        // DB から正常に取得できた場合のみ保存を有効化
        setSaveEnabled(true);
      })
      .catch((e) => {
        console.error("データ読み込み失敗:", e);
        setLoadError(true);
      })
      .finally(() => setDataLoaded(true));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  // DB から正常ロードできた場合のみ保存を有効化（saveEnabled が false の間は絶対に保存しない）
  useEffect(() => { if (saveEnabled) debouncedSave("mq-projects", projects); }, [projects, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-mf", mf); },           [mf, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-ab", ab); },            [ab, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-targets", targets); },  [targets, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-bs", bs); },            [bs, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-share", shareRate); },  [shareRate, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-prev",  prev); },       [prev,  saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-prev2", prev2); },      [prev2, saveEnabled, debouncedSave]);

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

  // ── データ読み込みエラー（保存は絶対に行わない） ─────────
  if (loadError) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f0f4f8",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <p style={{ color: "#ef4444", fontSize: 15, fontWeight: 600, margin: 0 }}>
          データの読み込みに失敗しました
        </p>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
          ネットワーク接続を確認して再試行してください
        </p>
        <button
          onClick={loadData}
          style={{
            marginTop: 8, padding: "10px 24px", background: "#3b82f6",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          再試行
        </button>
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
        {tab==="dash"     && <DashTab comp={comp} targets={targets} aiHints={aiHints} onOpenFixed={() => setShowFM(true)} projects={projects} shareRate={shareRate} onGoShare={() => setTab("share")} prev={prev} prev2={prev2} onEditPrev={() => setShowPrevM(true)}/>}
        {tab==="proj"     && <ProjectsTab projects={projects} filterMonth={filterMonth} onFilterMonth={setFilterMonth} onNewProject={() => { setEditP(null); setShowPM(true); }} onEditProject={p => { setEditP(p); setShowPM(true); }}/>}
        {tab==="month"    && <MonthTab comp={comp} selectedMonth={filterMonth} onSelectMonth={setFilterMonth}/>}
        {tab==="analysis" && <AnalysisTab comp={comp} targets={targets} projects={projects}/>}
        {tab==="bs"       && <BSTab bs={bs} onEdit={() => setShowBM(true)}/>}
        {tab==="share"    && <ShareRateTab projects={projects} shareRate={shareRate} onChange={setShareRate}/>}
      </div>

      {showPM && <ProjectModal project={editP} onSave={handleSaveProject} onClose={() => { setShowPM(false); setEditP(null); }} onDelete={editP ? id => setProjects(prev => prev.filter(p=>p.id!==id)) : undefined}/>}
      {showFM && <FixedModal mfData={mf} abData={ab} onSave={(f2,b2) => { setMf(f2); setAb(b2); }} onClose={() => setShowFM(false)}/>}
      {showTM && <TargetModal targets={targets} onSave={setTargets} onClose={() => setShowTM(false)}/>}
      {showBM && <BSModal bs={bs} onSave={setBs} onClose={() => setShowBM(false)}/>}
      {showPrevM && <PrevModal prev={prev} prev2={prev2} onSave={(p, p2) => { setPrev(p); setPrev2(p2); }} onClose={() => setShowPrevM(false)}/>}
    </div>
  );
}
