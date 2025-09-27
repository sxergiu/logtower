import {Component, OnInit, OnDestroy, inject} from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { UnlistenFn } from '@tauri-apps/api/event';
import {ActivatedRoute, Router, RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  private unlistenHotkey?: UnlistenFn;
  router = inject(Router);
  route = inject(ActivatedRoute);

  async ngOnInit() {

    this.route.queryParams.subscribe(params => {
      if (params['route']) {
        this.router.navigate([`/${params['route']}`]);
      }
    });

  }

  ngOnDestroy() {
    // Clean up the listener
    if (this.unlistenHotkey) {
      this.unlistenHotkey();
    }
  }
  
  async testHotkey() {
    try {
      console.log('Testing manual hotkey trigger...');
      const result = await invoke('test_hotkey_event');
      console.log('Manual test result:', result);
      alert('Manual test successful: ' + result);
    } catch (error) {
      console.error('Manual test failed:', error);
      alert('Manual test failed: ' + error);
    }
  }
}