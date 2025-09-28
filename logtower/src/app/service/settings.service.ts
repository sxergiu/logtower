import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Project } from '../models/project.model';
import { UserSettings } from '../models/user-settings.model';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {

    async getAllProjects(): Promise<Project[]> {
        return await invoke<Project[]>('get_all_projects');
    }

    async getCurrentSettings(): Promise<UserSettings> {
        return await invoke<UserSettings>('get_current_settings');
    }

    async addProject(name: string): Promise<Project> {
        return await invoke<Project>('add_project', { name });
    }

    async addTask(projectId: number, name: string): Promise<Task> {
        return await invoke<Task>('add_task', { projectId, name });
    }

    async setActiveProject(projectId?: number): Promise<void> {
        await invoke('set_active_project', { projectId });
    }

    async setActiveTask(taskId?: number): Promise<void> {
        await invoke('set_active_task', { taskId });
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
