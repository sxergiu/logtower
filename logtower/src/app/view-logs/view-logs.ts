import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {LogService} from "../service/log.service";
import {NgOptimizedImage} from "@angular/common";
import {LogViewFilter} from "./log-view-filter/log-view-filter";
import {SettingsDrawer} from "../settings-drawer/settings-drawer";
import {LogModel} from "../models/log.model";

@Component({
  selector: 'app-view-logs',
    imports: [
        FormsModule,
        NgOptimizedImage,
        LogViewFilter,
        SettingsDrawer,
    ],
  templateUrl: './view-logs.html',
  styleUrl: './view-logs.css'
})
export class ViewLogs {

  router = inject(Router);
  logService = inject(LogService);

  logs = this.logService.logs;

  constructor() {
    console.log(this.logs());
  }

  showModal = false;
  editingLog: number | null = null;
  editLogValue = '';

  deleteLogs() {
    this.showModal = true;
  }

  confirmDelete() {
    this.showModal = false;
    this.performAllLogsDeletion();
  }

  cancelDelete() {
    this.showModal = false;
  }

  performAllLogsDeletion() {
    this.logService.deleteAllLogs();
  }

  formatTime(dateString: string): string {
    const timePart = dateString.split(' ')[1];
    return timePart || dateString;
  }

  formatDate(dateString: string): string {
    const timePart = dateString.split(' ')[0];
    return timePart || dateString;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToProjectView(projectId: number) {
    this.router.navigate(['/logs', projectId]);
  }

  goToTaskView(projectId: number,taskId: number) {
    this.router.navigate(['/logs',projectId,taskId]);
  }

  deleteLog(id: number) {
    this.logService.deleteLogById(id);
  }

  startEditLog(log: any) {
    this.editingLog = log.id;
    this.editLogValue = log.message;
  }

  cancelEditLog() {
    this.editingLog = null;
    this.editLogValue = '';
  }

  saveEditLog(logId: number) {
    if( this.editLogValue.trim()) {

      const logs = this.logs();

      const updatedLogs = logs.map(log =>
          log.id === logId ? { ...log, message: this.editLogValue } : log
      );

      this.logs.set(updatedLogs);

      this.logService.editLog(logId, this.editLogValue);
      this.editLogValue = '';
      this.editingLog = null;
    }
  }

  onLogsFiltered(logs: LogModel[]) {
    this.logs.set(logs);
  }

  loading=false;
  onFilterLoading(loading: boolean) {
    this.loading = loading;
  }
}
