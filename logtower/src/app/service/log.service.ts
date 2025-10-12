
import {inject, Injectable} from '@angular/core';
import { invoke} from "@tauri-apps/api/core";
import { LogEntry } from '../models/log-entry.model';
import {TaskService} from "./task.service";
import {ProjectService} from "./project.service";

@Injectable({ providedIn: 'root' })
export class LogService {

    private taskService = inject(TaskService);
    private projectService = inject(ProjectService);

    async addLog(message: string): Promise<void> {
        await invoke('add_log', { message });
    }

    async getLogs(): Promise<LogEntry[]> {
        const logs = await invoke<LogEntry[]>('get_logs');

        // Get unique IDs
        const projectIds = [...new Set(logs.map(l => l.project_id).filter(id => id !== null))];
        const taskIds = [...new Set(logs.map(l => l.task_id).filter(id => id !== null))];

        // Fetch all projects and tasks in parallel
        const [projects, tasks] = await Promise.all([
            Promise.all(projectIds.map(id => this.projectService.getProjectById(id!))),
            Promise.all(taskIds.map(id => this.taskService.getTaskById(id!)))
        ]);

        // Create lookup maps
        const projectMap = new Map(projects.filter(p => p !== null).map(p => [p!.id, p!.name]));
        const taskMap = new Map(tasks.filter(t => t !== null).map(t => [t!.id, t!.name]));

        // Enrich logs
        return logs.map(log => ({
            ...log,
            projectName: log.project_id ? projectMap.get(log.project_id) ?? 'Unknown Project' : 'No Project',
            taskName: log.task_id ? taskMap.get(log.task_id) ?? 'Unknown Task' : 'No Task'
        }));
    }

    async deleteAllLogs(): Promise<void> {
        await invoke('delete_all_logs');
    }
}
