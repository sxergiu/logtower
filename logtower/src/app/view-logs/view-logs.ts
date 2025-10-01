import {Component, inject, signal} from '@angular/core';
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {LogService} from "../service/log.service";
import {LogEntry} from "../models/log-entry.model";
import {NgForOf} from "@angular/common";

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

  logs = signal<LogEntry[]>([]);


  constructor(private logService: LogService) {}

  async loadLogs() {
    this.logs.set( await this.logService.getLogs() );
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

  formatTime(dateString: string): string {
    const timePart = dateString.split(' ')[1];
    return timePart || dateString;
  }

  formatDate(dateString: string): string {
    const timePart = dateString.split(' ')[0];
    return timePart || dateString;
  }

}
