
import { inject, Injectable, signal} from '@angular/core';
import { invoke} from "@tauri-apps/api/core";
import { LogEntry } from '../models/log-entry.model';
import {TaskService} from "./task.service";
import {ProjectService} from "./project.service";
import {listen} from "@tauri-apps/api/event";

@Injectable({ providedIn: 'root'})
export class LogService {

    private taskService = inject(TaskService);
    private projectService = inject(ProjectService);

    logs = signal<LogEntry[]>([]);

    constructor() {
        this.fetchLogs();
        this.setupEventListeners();
    }

    private async setupEventListeners() {
        // Listen for log updates from other windows
        await listen('logs-updated', async () => {
            await this.fetchLogs();
        });
    }
    async fetchLogs() {
        const logs = await this.getLogs();
        this.logs.set(logs);
    }

    async addLog(message: string): Promise<void> {
        const addedLog = await invoke<LogEntry>('add_log', { message });
        this.logs.update(currentLogs => [...currentLogs, addedLog]);
        // Emit event to notify other windows
        await invoke('emit_logs_updated');
    }

    async getLogs(): Promise<LogEntry[]> {
        const logs = await invoke<LogEntry[]>('get_logs_with_project');

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
            projectName: projectMap.get(log.project_id) ?? 'Unknown Project',
            taskName: log.task_id ? taskMap.get(log.task_id) ?? 'Unknown Task' : 'No Task'
        }));
    }

    async deleteAllLogs(): Promise<void> {
        await invoke('delete_all_logs');
        await invoke('emit_logs_updated');
    }
}
