import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {LogService} from "../service/log.service";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-view-logs',
    imports: [
        FormsModule,
        NgOptimizedImage,
    ],
  templateUrl: './view-logs.html',
  styleUrl: './view-logs.css'
})
export class ViewLogs {

  router = inject(Router);
  logService = inject(LogService);

  logs = this.logService.logs;

  showModal = false;

  deleteLogs() {
    this.showModal = true;
  }

  confirmDelete() {
    this.showModal = false;
    this.performLogDeletion();
  }

  cancelDelete() {
    this.showModal = false;
  }

  performLogDeletion() {
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

}
