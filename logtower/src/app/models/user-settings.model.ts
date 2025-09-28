export interface UserSettings {
    id: number;
    activeProjectId?: number | null;
    activeTaskId?: number | null;
    theme?: string;      // e.g. "light" | "dark"
    language?: string;   // e.g. "en", "de", etc.
}
