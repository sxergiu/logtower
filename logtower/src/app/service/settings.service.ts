import { Injectable, signal} from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { UserSettings } from '../models/user-settings.model';
import {emit} from "@tauri-apps/api/event";

@Injectable({ providedIn: 'root' })
export class SettingsService {

    userSettings = signal<UserSettings | null>(null);

    constructor() {
        this.loadData();
    }

    async loadData() {
        const userSettings = await this.getCurrentSettings();
        this.userSettings.set(userSettings);

    }

    async reloadSettings() {
        await this.loadData();
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

    async setActiveProject(projectId?: number | null): Promise<void> {
        await invoke('set_active_project', { projectId: projectId ?? null });
        this.userSettings.update((settings) => ({
            ...(settings ?? { activeProjectId: null, activeTaskId: null }),
            activeProjectId: projectId ?? null,
        }));
        await emit('settings-updated', { type: 'project', projectId });
    }

    async setActiveTask(taskId?: number | null): Promise<void> {
        await invoke('set_active_task', { taskId: taskId ?? null });
        this.userSettings.update((settings) => ({
            ...(settings ?? { activeProjectId: null, activeTaskId: null }),
            activeTaskId: taskId ?? null,
        }));
        await emit('settings-updated', { type: 'task', taskId });
    }
}
