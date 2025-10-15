export interface TaskEntry {
    id: number;
    projectId: number;
    name: string;
    createdAt?: string; // ISO date, optional
    completed?: boolean;
}
