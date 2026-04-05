"use client";
import { C, MS, VK, VL, STC, STCBG } from "@/lib/constants";
import { totalV } from "@/lib/data";
import type { Project } from "@/lib/types";

interface ProjectsTabProps {
  projects: Project[];
  filterMonth: number | null;
  onFilterMonth: (m: number | null) => void;
  onNewProject: () => void;
  onEditProject: (p: Project) => void;
}

export default function ProjectsTab({ projects, filterMonth, onFilterMonth, onNewProject, onEditProject }: ProjectsTabProps) {
  const filtered = (filterMonth !== null ? projects.filter(p => p.month === filterMonth) : projects)
    .sort((a, b) => a.month - b.month);

  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:C.t1 }}>案件管理</div>
          <div style={{ fontSize:12, color:C.t2, marginTop:2 }}>全 {projects.length} 件</div>
        </div>
        <button onClick={onNewProject} className="btn-primary" style={{ display:"flex", alignItems:"center", gap:6 }}>
          ＋ 新規案件
        </button>
      </div>

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

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px 0", color:C.t3 }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
          <div style={{ fontSize:14 }}>案件がありません</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(p => {
          const tv = totalV(p.v), m = p.p - tv;
          const mr = p.p > 0 ? m / p.p * 100 : 0;
          return (
            <div key={p.id} onClick={() => onEditProject(p)}
              className="card stagger-item"
              style={{
                cursor:"pointer", marginBottom:0,
                borderLeft:"4px solid "+(STC[p.status] || C.t3),
                transition:"box-shadow .2s, transform .15s",
              }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{
                      padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:700,
                      background:STCBG[p.status]||"#f1f5f9",
                      color:STC[p.status]||C.t2,
                    }}>{p.status}</span>
                    <span style={{ fontSize:11, color:C.t3 }}>{MS[p.month]}</span>
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
                  <div style={{ fontSize:10, color:C.t3, marginBottom:4 }}>P={p.p} / V={tv}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:C.blue, lineHeight:1 }}>
                    M={m}<span style={{ fontSize:10, color:C.t3 }}>万</span>
                  </div>
                  <div style={{
                    display:"inline-block", marginTop:4, padding:"3px 10px",
                    borderRadius:99, fontSize:12, fontWeight:700,
                    background: mr>=48?C.greenLight:mr>=40?C.yellowLight:C.redLight,
                    color: mr>=48?C.greenDark:mr>=40?"#92400e":C.red,
                  }}>{mr.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
