import {afterRenderEffect, Component, ElementRef, inject, input, LOCALE_ID, output} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {LogModel} from "../../models/log.model";
import {formatLocal} from "../format-local";

@Component({
  selector: 'app-log-view-inspector',
  imports: [
    FormsModule,
    NgOptimizedImage
  ],
  templateUrl: './log-view-inspector.html',
  styleUrl: './log-view-inspector.css',
  host: {
    '(document:keydown)': 'onKeydown($event)'
  }
})
export class LogViewInspector {

  logs = input<LogModel[]>([]);
  log = input<LogModel | null>(null);
  index = input<number>(-1);

  inspectLog = output<number>();
  previous = output<void>();
  next = output<void>();
  back = output<void>();

  selectedProjectId = output<number>();
  selectedTaskId = output<number>();

  editLog = output<{ id: number; newMessage: string }>();
  deleteLog = output<number>();

  editingLog: number | null = null;
  editLogValue = '';

  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    afterRenderEffect(() => {
      this.log();
      this.host.nativeElement.querySelector('.mini-row.active')?.scrollIntoView({ block: 'nearest' });
    });
  }

  formatTime(dateString: string): string {
    return formatLocal(dateString, 'HH:mm:ss', this.locale);
  }

  formatShortTime(dateString: string): string {
    return formatLocal(dateString, 'HH:mm', this.locale);
  }

  formatDate(dateString: string): string {
    return formatLocal(dateString, 'yyyy-MM-dd', this.locale);
  }

  select(id: number) {
    this.cancelEditLog();
    this.inspectLog.emit(id);
  }

  goPrevious() {
    this.cancelEditLog();
    this.previous.emit();
  }

  goNext() {
    this.cancelEditLog();
    this.next.emit();
  }

  startEditLog(log: LogModel) {
    this.editingLog = log.id;
    this.editLogValue = log.message;
  }

  saveEditLog(logId: number) {
    if (this.editLogValue.trim().length === 0) return;
    this.editLog.emit({ id: logId, newMessage: this.editLogValue });
    this.cancelEditLog();
  }

  cancelEditLog() {
    this.editingLog = null;
    this.editLogValue = '';
  }

  onEditEnter(event: Event, id: number) {
    const kbEvent = event as KeyboardEvent;
    if (kbEvent.isComposing) return;
    if (kbEvent.shiftKey) return;
    event.preventDefault();
    this.saveEditLog(id);
  }

  // An open edit keeps the arrows and Esc even with focus on Save/Cancel, so they cannot drop the unsaved text
  onKeydown(event: KeyboardEvent) {
    if (this.editingLog !== null) return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.goPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.goNext();
        break;
      case 'Escape':
        event.preventDefault();
        this.back.emit();
        break;
    }
  }

}
