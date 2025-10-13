import {Component, effect, inject } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {LogEntry} from "../../models/log-entry.model";
import {NgOptimizedImage} from "@angular/common";
import {LogService} from "../../service/log.service";

@Component({
  selector: 'app-view-logs-by-project',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './view-logs-by-project.html',
  styleUrl: '../view-logs.css'
})
export class ViewLogsByProject{

  logService = inject(LogService);
  logsByProject: LogEntry[] = [] ;
  route = inject(ActivatedRoute);
  router = inject(Router);

  projectId = -1;
  constructor() {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));

    effect(() => {
      this.logsByProject = this.logService.logs().filter(log => log.project_id === this.projectId);
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

  goToTaskView(taskId: number) {
    this.router.navigate(['logs',this.projectId, taskId])
  }
}
