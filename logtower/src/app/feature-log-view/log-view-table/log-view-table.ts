import {Component, inject, input, LOCALE_ID, output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {formatDate, NgOptimizedImage} from "@angular/common";
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

  private readonly locale = inject(LOCALE_ID);

  formatTime(dateString: string): string {
    return this.formatLocal(dateString, 'HH:mm:ss');
  }

  formatDate(dateString: string): string {
    return this.formatLocal(dateString, 'yyyy-MM-dd');
  }

  // Timestamps are SQLite datetime('now'): UTC, but written without a zone,
  // which Date would otherwise read as local time
  private formatLocal(dateString: string, format: string): string {
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    return isNaN(date.getTime()) ? dateString : formatDate(date, format, this.locale);
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

  onEditEnter(event: Event, id: number) {
    const kbEvent = event as KeyboardEvent;
    if (kbEvent.isComposing) return;
    if (kbEvent.shiftKey) return;
    event.preventDefault();
    this.saveEditLog(id);
  }

}
