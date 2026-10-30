import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Injectable({ providedIn: 'root' })
export class AppService {

    async quit(): Promise<void> {
        return invoke<void>('quit_app');
    }
}
