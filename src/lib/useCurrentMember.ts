"use client";
import { useState, useEffect, useCallback } from "react";
import type { Member } from "@/lib/project-types";

const STORAGE_KEY = "pm_current_user_id";

/**
 * 「あなたは誰ですか」を端末に記憶しておく仕組み。
 * ログインとは別に、完了操作をした本人を自動記録するために使う（TASUKIと同じ考え方だが完全に別ストレージ）。
 */
export function useCurrentMember() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentIdState(localStorage.getItem(STORAGE_KEY));
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setCurrentId = useCallback((id: string | null) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    setCurrentIdState(id);
  }, []);

  const currentMember = members.find((m) => m.id === currentId) ?? null;

  return { members, currentId, setCurrentId, currentMember, loaded };
}
