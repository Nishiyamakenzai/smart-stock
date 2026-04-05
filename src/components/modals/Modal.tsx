"use client";
import { C } from "@/lib/constants";
import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0,
      background:"rgba(15,23,42,.45)",
      backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:16,
      animation:"fadeIn .2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#ffffff",
        borderRadius:20, padding:"24px 24px",
        width:"100%", maxWidth:520,
        maxHeight:"90vh", overflowY:"auto",
        border:"1px solid "+C.bdr,
        boxShadow:"0 24px 60px rgba(15,23,42,.18)",
        animation:"scaleIn .25s cubic-bezier(.16,1,.3,1)",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:C.t1, margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{
            width:32, height:32,
            background:C.card3, border:"none",
            borderRadius:99, fontSize:15, color:C.t2,
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background .15s",
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
