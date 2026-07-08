export type JobType = "craftsman" | "site_management" | "office";

export const JOB_TYPES: JobType[] = ["craftsman", "site_management", "office"];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  craftsman: "職人",
  site_management: "施工管理",
  office: "事務",
};

export const DEFAULT_JOB_TYPE: JobType = "craftsman";

export function isJobType(v: unknown): v is JobType {
  return typeof v === "string" && (JOB_TYPES as string[]).includes(v);
}
