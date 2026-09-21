"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/project-types";

interface SnapshotMeta {
  slot: number;
  createdAt: string;
  counts: { projects: number; processes: number; logs: number };
}

export default function BackupsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const reload = () => {
    fetch("/api/projects/backup/list")
      .then((r) => r.json())
      .then((d) => setSnapshots(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const runBackupNow = async () => {
    setRunning(true);
    await fetch("/api/projects/backup");
    reload();
    setRunning(false);
  };

  const download = async (slot: number, createdAt: string) => {
    const res = await fetch(`/api/projects/backup/${slot}`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-backup-${createdAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>読み込み中...</div>;

  return (
    <div style={{ padding: "16px 14px 40px" }}>
      <Link href="/projects/settings" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← 設定</Link>
      <div className="section-title" style={{ marginTop: 12 }}>データバックアップ</div>
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
        毎日自動でデータの複製（最大10世代）を保存しています。万が一データが消えても、ここから内容を確認・ダウンロードできます。
      </p>

      <button className="btn-primary" onClick={runBackupNow} disabled={running} style={{ width: "100%", marginBottom: 16 }}>
        {running ? "バックアップ中..." : "今すぐバックアップを取る"}
      </button>

      {snapshots.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>
          まだバックアップがありません。上のボタンで最初のバックアップを作成できます。
        </div>
      ) : (
        snapshots.map((s) => (
          <div key={s.slot} className="card-flat" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{formatDateTime(s.createdAt)}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                案件 {s.counts.projects}件 ／ 工程 {s.counts.processes}件 ／ 履歴 {s.counts.logs}件
              </div>
            </div>
            <button onClick={() => download(s.slot, s.createdAt)} className="btn-outline">ダウンロード</button>
          </div>
        ))
      )}
    </div>
  );
}
