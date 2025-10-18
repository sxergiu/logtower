import {Component, effect, inject, signal, computed } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {LogModel} from "../../models/log.model";
import {NgOptimizedImage} from "@angular/common";
import {LogService} from "../../service/log.service";
import {LogViewFilter} from "../log-view-filter/log-view-filter";

@Component({
  selector: 'app-view-logs-by-project',
  imports: [
    NgOptimizedImage,
    LogViewFilter
  ],
  templateUrl: './view-logs-by-project.html',
  styleUrl: '../view-logs.css'
})
export class ViewLogsByProject{

  logService = inject(LogService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  projectId = -1;

  // Writable signal for filtered logs
  filteredLogs = signal<LogModel[]>([]);

  // Track if filters are active
  isFiltered = signal<boolean>(false);

  // Default logs from route params
  defaultLogsByProject = computed(() => {
    const logs = this.logService.logs();
    return logs.filter(log => log.project_id === this.projectId);
  });

  // Display logs: use filtered if available, otherwise use default
  logsByProject = computed(() =>
      this.isFiltered() ? this.filteredLogs() : this.defaultLogsByProject()
  );

  loading = signal<boolean>(false);

  constructor() {
    this.projectId = Number(this.route.snapshot.paramMap.get('projectId'));

    // Optional: Load default logs on init
    effect(() => {
      if (!this.isFiltered()) {
        // This ensures the default logs are reactive to logService changes
        this.defaultLogsByProject();
      }
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
    this.router.navigate(['logs', this.projectId, taskId])
  }

  deleteLogsByProject(projectId: number) {
    this.logService.deleteLogsByProjectId(projectId);
  }

  deleteLog(id: number) {
    this.logService.deleteLogById(id);
  }

  onLogsFiltered(logs: LogModel[]) {
    this.filteredLogs.set(logs);
    this.isFiltered.set(true);
  }

  onFilterLoading(loading: boolean) {
    this.loading.set(loading);
  }

  clearFilters() {
    this.isFiltered.set(false);
    this.filteredLogs.set([]);
  }
}