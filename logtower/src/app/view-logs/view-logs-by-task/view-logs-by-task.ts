import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgOptimizedImage } from "@angular/common";
import { LogService } from "../../service/log.service";
import { LogEntry } from "../../models/log-entry.model";
import { ActivatedRoute, Router } from "@angular/router";
import { TaskService } from "../../service/task.service";
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {ProjectService} from "../../service/project.service";
import {Project} from "../../models/project.model";
import {TaskEntry} from "../../models/task-entry.model";

@Component({
  selector: 'app-view-logs-by-task',
  imports: [NgOptimizedImage],
  templateUrl: './view-logs-by-task.html',
  styleUrl: '../view-logs.css'
})
export class ViewLogsByTask {
  logService = inject(LogService);
  taskService = inject(TaskService);
  projectService = inject(ProjectService);

  tasksByProject = this.taskService.tasksByProject;

  route = inject(ActivatedRoute);
  router = inject(Router);

  // Convert route params to a signal
  routeParams = toSignal(
      this.route.paramMap.pipe(
          map(params => ({
            projectId: Number(params.get('projectId')),
            taskId: Number(params.get('taskId'))
          }))
      ),
      { initialValue: { projectId: -1, taskId: -1 } }
  );

  // Use computed instead of effect for derived state
  logsByTask = computed(() => {
    const params = this.routeParams();
    const logs = this.logService.logs();
    return logs.filter(log =>
        log.project_id === params.projectId &&
        log.task_id === params.taskId
    );
  });

  projectId = computed(() => this.routeParams().projectId);
  project = signal<Project | null>(null);
  taskId = computed(() => this.routeParams().taskId);
  task = signal<TaskEntry | null>(null);
  constructor() {
    this.getProject();
    this.getTask();
  }
  async getProject() {
    const project = await this.projectService.getProjectById(this.projectId())
    this.project.set(project);
  }

  async getTask() {
    const task = await this.taskService.getTaskById(this.taskId());
    this.task.set(task);
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

  setSelectedTask(task: any) {
    this.router.navigate(['logs', this.projectId(), task.id]);
  }
}