import {Component, input, output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {LogModel} from "../../models/log.model";

@Component({
  selector: 'app-log-view-table',
  imports: [
    FormsModule,
    NgOptimizedImage
  ],
  templateUrl: './log-view-table.html',
  styleUrl: './log-view-table.css'
})
export class LogViewTable {

  logs = input<LogModel[]>([]);
  isProjectView = input<boolean>(false);
  isTaskView = input<boolean>(false);

  selectedProjectId = output<number>();
  selectedTaskId = output<number>();

  editLog = output<{ id: number; newMessage: string }>();
  deleteLog = output<number>();


  editingLog: number | null = null;
  editLogValue = '';

  formatTime(dateString: string): string {
    const timePart = dateString.split(' ')[1];
    return timePart || dateString;
  }

  formatDate(dateString: string): string {
    const timePart = dateString.split(' ')[0];
    return timePart || dateString;
  }

  startEditLog(log: any) {
    this.editingLog = log.id;
    this.editLogValue = log.message;
  }

  saveEditLog(logId: number) {
    if (this.editLogValue.trim().length === 0) return;
    this.editLog.emit({ id: logId, newMessage: this.editLogValue });
    this.cancelEditLog();
  }

  onDeleteLog(logId: number) {
    this.deleteLog.emit(logId);
  }

  cancelEditLog() {
    this.editingLog = null;
    this.editLogValue = '';
  }

  onProjectBadgeClick($event: number) {
    this.selectedProjectId.emit($event);
  }

  onTaskBadgeClick($event: number) {
    this.selectedTaskId.emit($event);
  }
}
