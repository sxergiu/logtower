import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {LogService} from "../service/log.service";
import {LogEntry} from "../models/log-entry.model";

@Component({
  selector: 'app-view-logs',
  imports: [
    FormsModule,
  ],
  templateUrl: './view-logs.html',
  styleUrl: './view-logs.css'
})
export class ViewLogs {

  router = inject(Router);

  logs: LogEntry[] = [];
  newMessage = '';

  constructor(private logService: LogService) {}

  async addLog() {
    if (!this.newMessage.trim()) return;
    await this.logService.addLog(this.newMessage);
    this.newMessage = '';
    await this.loadLogs();
  }

  async loadLogs() {
    this.logs = await this.logService.getLogs();
  }

  async deleteLogs() {
    await this.logService.deleteAllLogs();
    await this.loadLogs()
  }

  ngOnInit() {
    this.loadLogs();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
