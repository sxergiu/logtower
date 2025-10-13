import { Injectable, signal} from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { UserSettings } from '../models/user-settings.model';

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
    }

    async setActiveTask(taskId?: number | null): Promise<void> {
        await invoke('set_active_task', { taskId: taskId ?? null });
    }
}
