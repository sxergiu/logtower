// src/app/services/log.service.ts
import { Injectable } from '@angular/core';
import { invoke} from "@tauri-apps/api/core";
import { LogEntry } from '../models/log-entry.model';

@Injectable({ providedIn: 'root' })
export class LogService {
    async addLog(message: string): Promise<void> {
        await invoke('add_log', { message });
    }

    async getLogs(): Promise<LogEntry[]> {
        return await invoke<LogEntry[]>('get_logs');
    }

    async deleteAllLogs(): Promise<void> {
        await invoke('delete_all_logs');
    }
}
