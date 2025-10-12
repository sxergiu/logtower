import {Component, inject} from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  router = inject(Router);
  greetingMessage = "";

  greet(event: SubmitEvent, name: string): void {
    event.preventDefault();

    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    invoke<string>("greet", { name }).then((text) => {
      this.greetingMessage = text;
    });
  }

  goToSettings() {
    this.router.navigate(['settings']);
  }
  goToLogs() {
    this.router.navigate(['logs']);
  }
  goToManage() {
    this.router.navigate(['/manage']);
  }
}
