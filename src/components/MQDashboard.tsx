"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "./Header";
import DashTab from "./tabs/DashTab";
import ProjectsTab from "./tabs/ProjectsTab";
import MonthTab from "./tabs/MonthTab";
import AnalysisTab from "./tabs/AnalysisTab";
import BSTab from "./tabs/BSTab";
import ShareRateTab from "./tabs/ShareRateTab";
import PromoPlanTab from "./tabs/PromoPlanTab";
import ProjectModal from "./modals/ProjectModal";
import FixedModal from "./modals/FixedModal";
import TargetModal from "./modals/TargetModal";
import BSModal from "./modals/BSModal";
import PrevModal from "./modals/PrevModal";
import BackupModal from "./modals/BackupModal";
import { DEMO_PROJECTS, DEMO_MF, DEFAULT_AB, DEFAULT_TARGETS, DEFAULT_BS, DEFAULT_SHARE_RATE, DEFAULT_PROMO_PLAN, PREV, PREV2, migrateMF, migrateAB, defaultF3, defaultFixedCosts } from "@/lib/data";
import { computeData, aiOverall } from "@/lib/utils";
import type { Project, MonthlyFixed, AnnualBudget, Targets, BSData, ShareRateState, PrevPeriod, PromoPlanData, BackupSnapshot } from "@/lib/types";

type Tab = "dash" | "proj" | "month" | "analysis" | "bs" | "share" | "promo";
const TABS: [Tab, string][] = [["dash","総合"], ["proj","案件"], ["month","月次"], ["analysis","分析"], ["bs","B/S"], ["share","シェア率"], ["promo","販促計画"]];

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
  const [promoPlan, setPromoPlan] = useState<PromoPlanData>(DEFAULT_PROMO_PLAN);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  // saveEnabled は DB からの正常ロード後のみ true にする（エラー時に初期デモデータを上書き保存しないための安全弁）
  const [saveEnabled, setSaveEnabled] = useState(false);

  // 保存状態
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const pendingSaveCount = useRef(0);
  const saveErrorKeys = useRef(new Set<string>());
  const pendingData = useRef<Record<string, unknown>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 常に最新の全データを参照できる ref（beforeunload・スナップショット用）
  const currentDataRef = useRef<BackupSnapshot["data"]>({ projects, mf, ab, targets, bs, prev, prev2, promoPlan });
  const isMountedRef = useRef(true);

  useEffect(() => () => { isMountedRef.current = false; }, []);

  useEffect(() => {
    currentDataRef.current = { projects, mf, ab, targets, bs, prev, prev2, promoPlan };
  }, [projects, mf, ab, targets, bs, prev, prev2, promoPlan]);

  // UI状態
  const [tab, setTab] = useState<Tab>("dash");
  const [showPM, setShowPM] = useState(false);
  const [editP, setEditP] = useState<Project | null>(null);
  const [showFM, setShowFM] = useState(false);
  const [showTM, setShowTM] = useState(false);
  const [showBM, setShowBM] = useState(false);
  const [showPrevM, setShowPrevM] = useState(false);
  const [showBackupM, setShowBackupM] = useState(false);
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
        if (d["mq-promo"])    setPromoPlan(d["mq-promo"]);
        setSaveEnabled(true);
      })
      .catch((e) => {
        console.error("データ読み込み失敗:", e);
        setLoadError(true);
      })
      .finally(() => setDataLoaded(true));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── デバウンス自動保存（500ms）＋リトライ（2s/4s/8s）──────────
  const debouncedSave = useCallback((key: string, value: unknown) => {
    pendingData.current[key] = value;
    // localStorage へ即時ミラー（DB 保存失敗時のフォールバック）
    try { localStorage.setItem(`mq-ls-${key}`, JSON.stringify(value)); } catch {}

    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const val = pendingData.current[key];
      pendingSaveCount.current++;
      if (isMountedRef.current) setSaveStatus("saving");

      const retryDelays = [2000, 4000, 8000];
      let success = false;
      for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        if (attempt > 0) await new Promise(res => setTimeout(res, retryDelays[attempt - 1]));
        try {
          const r = await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value: val }),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          success = true;
          break;
        } catch {
          if (attempt >= retryDelays.length) break;
        }
      }

      if (success) {
        delete pendingData.current[key];
        saveErrorKeys.current.delete(key);
      } else {
        saveErrorKeys.current.add(key);
        console.error(`保存失敗: ${key}`);
      }

      pendingSaveCount.current--;
      if (isMountedRef.current && pendingSaveCount.current === 0) {
        if (saveErrorKeys.current.size > 0) {
          setSaveStatus("error");
        } else {
          setSaveStatus("saved");
          setTimeout(() => {
            if (isMountedRef.current) setSaveStatus(s => s === "saved" ? "idle" : s);
          }, 3000);
        }
      }
    }, 500);
  }, []);

  // ── ブラウザ閉じる直前に未保存データを sendBeacon で即時送信 ──
  useEffect(() => {
    const handle = () => {
      for (const [key, value] of Object.entries(pendingData.current)) {
        try {
          const blob = new Blob([JSON.stringify({ key, value })], { type: "application/json" });
          navigator.sendBeacon("/api/data", blob);
        } catch {}
      }
    };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, []);

  // DB から正常ロードできた場合のみ保存を有効化
  useEffect(() => { if (saveEnabled) debouncedSave("mq-projects", projects); }, [projects, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-mf", mf); },           [mf, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-ab", ab); },            [ab, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-targets", targets); },  [targets, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-bs", bs); },            [bs, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-share", shareRate); },  [shareRate, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-prev",  prev); },       [prev,  saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-prev2", prev2); },      [prev2, saveEnabled, debouncedSave]);
  useEffect(() => { if (saveEnabled) debouncedSave("mq-promo", promoPlan); },  [promoPlan, saveEnabled, debouncedSave]);

  // ── 自動バックアップ（30分ごと・最大10世代 localStorage 保存）──
  const takeSnapshot = useCallback(() => {
    try {
      const existing: BackupSnapshot[] = JSON.parse(localStorage.getItem("mq-snapshots") || "[]");
      const snap: BackupSnapshot = { ts: Date.now(), data: { ...currentDataRef.current } };
      localStorage.setItem("mq-snapshots", JSON.stringify([snap, ...existing].slice(0, 10)));
      return snap;
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    if (!saveEnabled) return;
    takeSnapshot(); // ロード完了直後に即時スナップショット
    const id = setInterval(takeSnapshot, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [saveEnabled, takeSnapshot]);

  // ── 計算 ──────────────────────────────────────────────────
  const comp = useMemo(() => computeData(projects, mf), [projects, mf]);
  const aiHints = useMemo(() => aiOverall(comp, targets), [comp, targets]);

  // 販促計画変更時に F3 戦略費の広告項目へリアルタイム連動
  const handlePromoChange = useCallback((plan: PromoPlanData) => {
    setPromoPlan(plan);
    setMf(prev => {
      const next: MonthlyFixed = {};
      for (let m = 0; m < 12; m++) {
        const item = plan.monthly[m];
        next[m] = {
          ...(prev[m] ?? defaultFixedCosts()),
          f3: {
            ...(prev[m]?.f3 ?? defaultF3()),
            adWeb:     item?.adWeb     ?? 0,
            adFlyer:   item?.adFlyer   ?? 0,
            adPortal:  item?.adPortal  ?? 0,
            adSign:    item?.adSign    ?? 0,
            adYoutube: item?.adYoutube ?? 0,
            other:     item?.other     ?? 0,
          },
        };
      }
      return next;
    });
  }, []);

  const handleSaveProject = (p: Project) => {
    if (editP) setProjects(prev => prev.map(x => x.id===editP.id ? {...p,id:editP.id} : x));
    else { const newId = Math.max(0,...projects.map(x=>x.id))+1; setProjects(prev => [...prev,{...p,id:newId}]); }
  };

  // バックアップから復元
  const handleRestoreBackup = useCallback((snap: BackupSnapshot) => {
    if (!window.confirm("このバックアップから復元しますか？現在のデータは上書きされます。")) return;
    setProjects(snap.data.projects);
    setMf(snap.data.mf);
    setAb(snap.data.ab);
    setTargets(snap.data.targets);
    setBs(snap.data.bs);
    setPrev(snap.data.prev);
    setPrev2(snap.data.prev2);
    setPromoPlan(snap.data.promoPlan);
    setShowBackupM(false);
  }, []);

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
        onOpenBackup={() => setShowBackupM(true)}
        saveStatus={saveStatus}
        onLogout={onLogout}/>

      <div style={{ position:"sticky", top:0, zIndex:100, background:"#ffffff", borderBottom:"1px solid #e2e8f0", boxShadow:"0 1px 4px rgba(15,23,42,.06)" }}>
        <div style={{ display:"flex", padding:"0 16px", overflowX:"auto", alignItems:"center" }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`tab-btn${tab===id?" active":""}`}>
              {label}
            </button>
          ))}
          <button
            onClick={() => window.open("/api/export", "_blank")}
            style={{
              marginLeft:"auto", flexShrink:0, padding:"6px 12px",
              background:"#16a34a", color:"#fff", border:"none",
              borderRadius:8, fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap",
            }}
          >
            ⬇ Excel出力
          </button>
        </div>
      </div>

      <div style={{ padding:"14px 16px", maxWidth:800, margin:"0 auto" }}>
        {tab==="dash"     && <DashTab comp={comp} targets={targets} aiHints={aiHints} onOpenFixed={() => setShowFM(true)} projects={projects} shareRate={shareRate} onGoShare={() => setTab("share")} prev={prev} prev2={prev2} onEditPrev={() => setShowPrevM(true)}/>}
        {tab==="proj"     && <ProjectsTab projects={projects} filterMonth={filterMonth} onFilterMonth={setFilterMonth} onNewProject={() => { setEditP(null); setShowPM(true); }} onEditProject={p => { setEditP(p); setShowPM(true); }}/>}
        {tab==="month"    && <MonthTab comp={comp} selectedMonth={filterMonth} onSelectMonth={setFilterMonth}/>}
        {tab==="analysis" && <AnalysisTab comp={comp} targets={targets} projects={projects}/>}
        {tab==="bs"       && <BSTab bs={bs} onEdit={() => setShowBM(true)}/>}
        {tab==="share"    && <ShareRateTab projects={projects} shareRate={shareRate} onChange={setShareRate}/>}
        {tab==="promo"    && <PromoPlanTab plan={promoPlan} mf={mf} targets={targets} onChange={handlePromoChange}/>}
      </div>

      {showPM && <ProjectModal project={editP} onSave={handleSaveProject} onClose={() => { setShowPM(false); setEditP(null); }} onDelete={editP ? id => setProjects(prev => prev.filter(p=>p.id!==id)) : undefined}/>}
      {showFM && <FixedModal mfData={mf} abData={ab} onSave={(f2,b2) => { setMf(f2); setAb(b2); }} onClose={() => setShowFM(false)}/>}
      {showTM && <TargetModal targets={targets} onSave={setTargets} onClose={() => setShowTM(false)}/>}
      {showBM && <BSModal bs={bs} onSave={setBs} onClose={() => setShowBM(false)}/>}
      {showPrevM && <PrevModal prev={prev} prev2={prev2} onSave={(p, p2) => { setPrev(p); setPrev2(p2); }} onClose={() => setShowPrevM(false)}/>}
      {showBackupM && <BackupModal onRestore={handleRestoreBackup} onTakeSnapshot={takeSnapshot} onClose={() => setShowBackupM(false)}/>}
    </div>
  );
}
