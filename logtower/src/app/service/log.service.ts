
import { inject, Injectable, signal} from '@angular/core';
import { invoke} from "@tauri-apps/api/core";
import { LogModel } from '../models/log.model';
import {TaskService} from "./task.service";
import {ProjectService} from "./project.service";
import {listen} from "@tauri-apps/api/event";

@Injectable({ providedIn: 'root'})
export class LogService {

    private taskService = inject(TaskService);
    private projectService = inject(ProjectService);

    logs = signal<LogModel[]>([]);

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
        const addedLog = await invoke<LogModel>('add_log', { message });
        this.logs.update(currentLogs => [...currentLogs, addedLog]);
        // Emit event to notify other windows
        await invoke('emit_logs_updated');
    }

    async getLogs(): Promise<LogModel[]> {
        const logs = await invoke<LogModel[]>('get_logs_with_project');

        console.log(logs);
        // Get unique IDs
        const projectIds = [...new Set(logs.map(l => l.project_id).filter(id => id !== null))];
        const taskIds = [...new Set(logs.map(l => l.task_id).filter(id => id !== null))];

        console.log(projectIds)
        // Fetch all projects and tasks in parallel

        const [projects, tasks] = await Promise.all([
            Promise.all(projectIds.map(id => {
                console.log("Fetching project with ID:", id);
                return this.projectService.getProjectById(id!);
            })),
            Promise.all(taskIds.map(id => {
                console.log("Fetching task with ID:", id);
                return this.taskService.getTaskById(id!);
            }))
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

    async getLogsByProjectId(projectId: number): Promise<LogModel[]> {
        const logs = await invoke<LogModel[]>('get_logs_by_project_id', {
            projectId
        });

        // Get unique task IDs
        const taskIds = [...new Set(logs.map(l => l.task_id).filter(id => id !== null))];

        // Fetch all tasks in parallel
        const tasks = await Promise.all(
            taskIds.map(id => this.taskService.getTaskById(id!))
        );

        // Create lookup map
        const taskMap = new Map(tasks.filter(t => t !== null).map(t => [t!.id, t!.name]));

        // Get project name once (since all logs are from the same project)
        const project = await this.projectService.getProjectById(projectId);
        const projectName = project?.name ?? 'Unknown Project';

        // Enrich logs
        return logs.map(log => ({
            ...log,
            projectName,
            taskName: log.task_id ? taskMap.get(log.task_id) ?? 'Unknown Task' : 'No Task'
        }));
    }

    async getLogsByTaskId(taskId: number): Promise<LogModel[]> {
        const logs = await invoke<LogModel[]>('get_logs_by_task_id', {
            taskId
        });

        // Get unique project IDs
        const projectIds = [...new Set(logs.map(l => l.project_id).filter(id => id !== null))];

        // Fetch all projects in parallel
        const projects = await Promise.all(
            projectIds.map(id => this.projectService.getProjectById(id!))
        );

        // Create lookup map
        const projectMap = new Map(projects.filter(p => p !== null).map(p => [p!.id, p!.name]));

        // Get task name once (since all logs are from the same task)
        const task = await this.taskService.getTaskById(taskId);
        const taskName = task?.name ?? 'Unknown Task';

        // Enrich logs
        return logs.map(log => ({
            ...log,
            projectName: projectMap.get(log.project_id) ?? 'Unknown Project',
            taskName
        }));
    }

    async editLog(id: number, newMessage: string) {
        await invoke("edit_log", {logId: id, newMessage});
        await invoke('emit_logs_updated');
    }

    async deleteAllLogs(): Promise<void> {
        await invoke('delete_all_logs');
        await invoke('emit_logs_updated');
    }

    async deleteLogById(logId: number) {
        await invoke('delete_log_by_id', {logId} )
        await invoke('emit_logs_updated');
    }

    async deleteLogsByTaskId(taskId: number) {
        await invoke('delete_logs_by_task_id', {taskId} )
        await invoke('emit_logs_updated');
    }

    async deleteLogsByProjectId(projectId: number) {
        await invoke('delete_logs_by_project_id', {projectId} )
        await invoke('emit_logs_updated');
    }
}
