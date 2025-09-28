export interface Task {
    id: number;
    projectId: number;
    name: string;
    createdAt?: string; // ISO date, optional
    completed?: boolean;
}
