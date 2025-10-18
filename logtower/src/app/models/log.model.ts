export interface LogModel {
    id: number;
    timestamp: string;
    message: string;
    project_id: number;
    task_id: number;
    projectName?: string;
    taskName?: string;
}
