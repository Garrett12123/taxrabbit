export type ActionResult<T = void> = T extends void
  ? { success?: boolean; error?: string }
  : { success?: boolean; error?: string; data?: T };
