import {Injectable, signal} from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Project } from '../models/project.model';
import { UserSettings } from '../models/user-settings.model';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {

    userSettings = signal<UserSettings | null>(null);
    projects = signal<Project[]>([]);
    tasksByProject = signal<{ [projectId: number]: Task[] }>({});

    constructor() {
        this.loadData();
    }

    async loadData() {
        const userSettings = await this.getCurrentSettings();
        const projects = await this.getAllProjects(); // API call
        const tasksMap: { [projectId: number]: Task[] } = {};
        for (const project of projects) {
            tasksMap[project.id] = await this.getTasksForProject(project.id);
        }
        this.userSettings.set(userSettings);
        this.projects.set(projects);
        this.tasksByProject.set(tasksMap);
    }

    async getAllProjects(): Promise<Project[]> {
        return await invoke<Project[]>('get_all_projects');
    }

    async getCurrentSettings(): Promise<UserSettings> {
        const raw = await invoke<{ active_project_id: number | null, active_task_id: number | null }>(
            'get_current_settings'
        );

        return {
            activeProjectId: raw.active_project_id,
            activeTaskId: raw.active_task_id
        };
    }

    async addProject(name: string): Promise<Project> {
        return await invoke<Project>('add_project', { name });
    }

    async addTask(projectId: number, name: string): Promise<Task> {
        return await invoke<Task>('add_task', { projectId, name });
    }

    async setActiveProject(projectId?: number | null): Promise<void> {
        await invoke('set_active_project', { projectId: projectId ?? null });
    }

    async setActiveTask(taskId?: number | null): Promise<void> {
        await invoke('set_active_task', { taskId: taskId ?? null });
    }


    async getProjectById(projectId: number): Promise<Project | null> {
        return await invoke<Project | null>('get_project_by_id', { projectId });
    }

    async getTaskById(taskId: number): Promise<Task | null> {
        return await invoke<Task | null>('get_task_by_id', { taskId });
    }

    async getTasksForProject(projectId: number): Promise<Task[]> {
        return await invoke<Task[]>('get_tasks_for_project', { projectId });
    }
}
