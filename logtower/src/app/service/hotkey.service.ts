import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Injectable({ providedIn: 'root' })
export class HotkeyService {

    async getFailedShortcuts(): Promise<string[]> {
        return invoke<string[]>('get_failed_shortcuts');
    }
}
