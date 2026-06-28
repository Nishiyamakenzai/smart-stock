"use client";
import { C, MS, VK, VL, STC, STCBG } from "@/lib/constants";
import { totalV } from "@/lib/data";
import { fmt1, fmtPct } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface ProjectsTabProps {
  projects: Project[];
  filterMonth: number | null;
  onFilterMonth: (m: number | null) => void;
  onNewProject: () => void;
  onEditProject: (p: Project) => void;
}

function ProjectCard({ p, onEdit }: { p: Project; onEdit: () => void }) {
  const tv = totalV(p.v), m = p.p - tv;
  const mr = p.p > 0 ? m / p.p * 100 : 0;
  return (
    <div onClick={onEdit}
      className="card stagger-item"
      style={{
        cursor:"pointer", marginBottom:0,
        borderLeft:"4px solid "+(p.nextYear ? C.orange : (STC[p.status] || C.t3)),
        transition:"box-shadow .2s, transform .15s",
      }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{
              padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700,
              background:STCBG[p.status]||"#f1f5f9",
              color:STC[p.status]||C.t2,
            }}>{p.status}</span>
            {p.nextYear && (
              <span style={{
                padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700,
                background:"#fff7ed", color:C.orange,
                border:`1px solid ${C.orange}40`,
              }}>来期</span>
            )}
            <span style={{ fontSize:11, color:C.t3 }}>{MS[p.month]}{p.nextYear ? "（来期）" : ""}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:C.t1, marginBottom:6 }}>{p.name}</div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {VK.filter(k => p.v[k as keyof typeof p.v] > 0).map(k => (
              <span key={k} style={{
                fontSize:9, padding:"1px 6px",
                background:C.card3, borderRadius:4, color:C.t2, fontWeight:500,
              }}>{VL[k]} {p.v[k as keyof typeof p.v]}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:10, color:C.t3, marginBottom:2 }}>
            P={fmt1(p.p)}万 / V={fmt1(tv)}万
          </div>
          <div style={{ fontSize:10, color:C.t3, marginBottom:4 }}>粗利</div>
          <div style={{ fontSize:22, fontWeight:900, color:m>=0?C.green:C.red, lineHeight:1 }}>
            {fmt1(m)}<span style={{ fontSize:10, color:C.t3, marginLeft:1 }}>万</span>
          </div>
          <div style={{
            display:"inline-block", marginTop:4, padding:"3px 10px",
            borderRadius:99, fontSize:12, fontWeight:700,
            background: mr>=48?C.greenLight:mr>=40?C.yellowLight:C.redLight,
            color: mr>=48?C.greenDark:mr>=40?"#92400e":C.red,
          }}>{fmtPct(mr)}%</div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsTab({ projects, filterMonth, onFilterMonth, onNewProject, onEditProject }: ProjectsTabProps) {
  const currentYearProjects = projects.filter(p => !p.nextYear);
  const nextYearProjects = projects.filter(p => p.nextYear).sort((a, b) => a.month - b.month);

  const filtered = (filterMonth !== null
    ? currentYearProjects.filter(p => p.month === filterMonth)
    : currentYearProjects
  ).sort((a, b) => a.month - b.month);

  // 来期案件の合計（参考表示用）
  const nextYearPQ = nextYearProjects.reduce((s, p) => s + p.p, 0);
  const nextYearMQ = nextYearProjects.reduce((s, p) => s + (p.p - totalV(p.v)), 0);

  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:C.t1 }}>案件管理</div>
          <div style={{ fontSize:12, color:C.t2, marginTop:2 }}>
            今期 {currentYearProjects.length}件
            {nextYearProjects.length > 0 && (
              <span style={{ color:C.orange, marginLeft:8 }}>
                ／ 来期 {nextYearProjects.length}件
              </span>
            )}
          </div>
        </div>
        <button onClick={onNewProject} className="btn-primary" style={{ display:"flex", alignItems:"center", gap:6 }}>
          ＋ 新規案件
        </button>
      </div>

      {/* 月フィルター（今期のみ） */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
        {[null, ...Array.from({length:12}, (_, i) => i)].map((m, idx) => (
          <button key={idx} onClick={() => onFilterMonth(m)}
            style={{
              padding:"5px 12px", border:"1.5px solid",
              borderColor: filterMonth===m ? C.blue : C.bdr,
              borderRadius:99, fontSize:11, fontWeight:600, cursor:"pointer",
              background: filterMonth===m ? C.blueLight : "#fff",
              color: filterMonth===m ? C.blue : C.t2,
              transition:"all .15s",
            }}>
            {m === null ? "すべて" : MS[m]}
          </button>
        ))}
      </div>

      {/* 今期案件 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 0", color:C.t3 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:14 }}>今期の案件がありません</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {filtered.map(p => (
            <ProjectCard key={p.id} p={p} onEdit={() => onEditProject(p)} />
          ))}
        </div>
      )}

      {/* 来期案件セクション */}
      {nextYearProjects.length > 0 && (
        <>
          {/* セクションヘッダー */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 14px", borderRadius:10, marginBottom:10,
            background:"#fff7ed", border:`1.5px solid ${C.orange}40`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>📅</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.orange }}>
                  来期案件（{nextYearProjects.length}件）
                </div>
                <div style={{ fontSize:11, color:"#92400e", marginTop:1 }}>
                  今期の集計には含まれません
                </div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"#92400e", fontWeight:600 }}>来期予定</div>
              <div style={{ fontSize:14, fontWeight:800, color:C.orange }}>
                PQ {fmt1(nextYearPQ)}万
              </div>
              <div style={{ fontSize:11, color:"#92400e" }}>
                MQ {fmt1(nextYearMQ)}万
              </div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {nextYearProjects.map(p => (
              <ProjectCard key={p.id} p={p} onEdit={() => onEditProject(p)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
