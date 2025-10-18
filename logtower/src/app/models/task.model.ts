export interface TaskModel {
    id: number;
    project_id: number;
    name: string;
    createdAt?: string; // ISO date, optional
    completed?: boolean;
}
