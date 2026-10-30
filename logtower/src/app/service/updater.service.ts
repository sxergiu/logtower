import { Injectable, signal } from '@angular/core';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';

// The app lives in the tray for days, so checking only at launch would rarely see a release
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type UpdateStatus = 'idle' | 'checking' | 'up-to-date' | 'check-failed'
    | 'available' | 'downloading' | 'ready' | 'failed';

@Injectable({ providedIn: 'root' })
export class UpdaterService {

    status = signal<UpdateStatus>('idle');
    availableVersion = signal<string | null>(null);
    // Percent, or null while the size is unknown
    progress = signal<number | null>(null);

    private update: Update | null = null;
    private timer?: ReturnType<typeof setInterval>;

    constructor() {
        // Quick-log loads the dashboard first (its index.html path redirects there),
        // and its webview is only hidden on close, so it would keep a checker of its own
        if (getCurrentWindow().label !== 'main') return;
        this.check();
        this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
    }

    // Only a check the user asked for reports its outcome; the background ones stay
    // silent so the title screen doesn't flash "checking" or "failed" at every launch
    async check(manual = false) {
        if (manual) this.status.set('checking');
        try {
            const update = await check();
            if (!update) {
                if (manual) this.status.set('up-to-date');
                return;
            }
            this.update = update;
            this.availableVersion.set(update.version);
            this.status.set('available');
            clearInterval(this.timer);
        } catch (e) {
            // Offline, or no release with a latest.json published yet; the next interval tries again
            console.warn('Update check failed', e);
            if (manual) this.status.set('check-failed');
        }
    }

    async install() {
        if (!this.update) return;
        this.status.set('downloading');
        let total = 0;
        let received = 0;
        try {
            await this.update.downloadAndInstall(event => {
                if (event.event === 'Started') {
                    total = event.data.contentLength ?? 0;
                } else if (event.event === 'Progress' && total) {
                    received += event.data.chunkLength;
                    this.progress.set(Math.round(received / total * 100));
                }
            });
            // Windows never gets here: its installer closes the app and starts the new one
            this.status.set('ready');
        } catch (e) {
            console.error('Update install failed', e);
            this.status.set('failed');
        }
    }

    async restart() {
        try {
            await relaunch();
        } catch (e) {
            console.error('Restart after update failed', e);
            this.status.set('failed');
        }
    }

    async openReleasePage() {
        await openUrl(`https://github.com/sxergiu/logtower/releases/tag/v${this.availableVersion()}`);
    }
}
