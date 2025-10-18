import { Component, computed, effect, inject, signal } from '@angular/core';
import {NgForOf, NgOptimizedImage} from "@angular/common";
import { LogService } from "../../service/log.service";
import { ActivatedRoute, Router } from "@angular/router";
import { TaskService } from "../../service/task.service";
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {ProjectService} from "../../service/project.service";
import {ProjectModel} from "../../models/project.model";
import {TaskModel} from "../../models/task.model";
import {LogViewFilter} from "../log-view-filter/log-view-filter";
import {LogModel} from "../../models/log.model";

@Component({
  selector: 'app-view-logs-by-task',
  imports: [NgOptimizedImage, LogViewFilter, NgForOf],
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

  // Writable signal for filtered logs
  filteredLogs = signal<LogModel[]>([]);

  // Track if filters are active
  isFiltered = signal<boolean>(false);

  // Default logs from route params
  defaultLogsByTask = computed(() => {
    const params = this.routeParams();
    const logs = this.logService.logs();
    return logs.filter(log =>
        log.project_id === params.projectId &&
        log.task_id === params.taskId
    );
  });

  // Display logs: use filtered if available, otherwise use default
  logsByTask = computed(() =>
      this.isFiltered() ? this.filteredLogs() : this.defaultLogsByTask()
  );

  projectId = computed(() => this.routeParams().projectId);
  project = signal<ProjectModel | null>(null);
  taskId = computed(() => this.routeParams().taskId);
  task = signal<TaskModel | null>(null);

  constructor() {
    effect(() => {
      this.getProject();
      this.getTask();
    });
  }

  async getProject() {
    console.log('viewlogsbytask' + this.projectId())
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

  drawerOpen = false;

  toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  deleteLogsByTask(id: number) {
    this.logService.deleteLogsByTaskId(id);
  }

  deleteLog(id: number) {
    this.logService.deleteLogById(id);
  }

  onLogsFiltered(logs: LogModel[]) {
    this.filteredLogs.set(logs);
    this.isFiltered.set(true);
  }

  clearFilters() {
    this.isFiltered.set(false);
    this.filteredLogs.set([]);
  }

  loading = false;
  onFilterLoading(loading: boolean) {
    this.loading = loading;
  }
}