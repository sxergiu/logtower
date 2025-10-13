import {Component, effect, inject} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {LogService} from "../../service/log.service";
import {LogEntry} from "../../models/log-entry.model";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-view-logs-by-task',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './view-logs-by-task.html',
  styleUrl: '../view-logs.css'
})
export class ViewLogsByTask {

  logService = inject(LogService);
  logsByTask: LogEntry[] = [] ;
  route = inject(ActivatedRoute);
  router = inject(Router);

  taskId = -1;
  projectId = -1;
  constructor() {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));

    this.taskId = Number(this.route.snapshot.paramMap.get('taskId'));

    effect(() => {
      this.logsByTask = this.logService.logs()
          .filter(log => log.project_id === this.projectId && log.task_id === this.taskId);
    });
  }

  formatTime(dateString: string): string {
    const timePart = dateString.split(' ')[1];
    return timePart || dateString;
  }

  formatDate(dateString: string): string {
    const timePart = dateString.split(' ')[0];
    return timePart || dateString;
  }

  goBack() {
    this.router.navigate(['logs']);
  }

}
