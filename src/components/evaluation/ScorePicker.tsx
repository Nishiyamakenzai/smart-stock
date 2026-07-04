"use client";
import { SCORE_LETTERS, SCORE_VALUES, SCORE_LABELS, SCORE_COLORS, ATTITUDE_RULE_LETTERS, valueToLetter, type ScoreLetter } from "@/lib/evaluation-constants";

export default function ScorePicker({
  value, onChange, attitudeOnly = false,
}: {
  value: number;
  onChange: (v: number) => void;
  attitudeOnly?: boolean;
}) {
  const letters = attitudeOnly ? ATTITUDE_RULE_LETTERS : SCORE_LETTERS;
  const selected = valueToLetter(value);
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {letters.map((letter: ScoreLetter) => {
        const active = selected === letter && SCORE_VALUES[letter] === value;
        const color = SCORE_COLORS[letter];
        return (
          <button
            key={letter}
            type="button"
            onClick={() => onChange(SCORE_VALUES[letter])}
            title={`${SCORE_LABELS[letter]}（${SCORE_VALUES[letter] > 0 ? "+" : ""}${SCORE_VALUES[letter]}点）`}
            style={{
              flex: "1 1 auto", minWidth: 56,
              padding: "8px 6px",
              borderRadius: 10,
              border: `1.5px solid ${active ? color : "#e2e8f0"}`,
              background: active ? color : "#fff",
              color: active ? "#fff" : color,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              transition: "all .12s",
            }}
          >
            <div style={{ fontSize: 15 }}>{letter}</div>
            <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.9, marginTop: 1 }}>{SCORE_LABELS[letter]}</div>
          </button>
        );
      })}
    </div>
  );
}
