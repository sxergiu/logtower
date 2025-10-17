import {Component, inject, output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {ProjectService} from "../../service/project.service";
import {TaskService} from "../../service/task.service";
import {LogService} from "../../service/log.service";
import {LogEntry} from "../../models/log-entry.model";
import {Router} from "@angular/router";

@Component({
  selector: 'app-log-view-filter',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    FormsModule
  ],
  templateUrl: './log-view-filter.html',
  styleUrl: './log-view-filter.css'
})
export class LogViewFilter {

  router = inject(Router);
  projectService = inject(ProjectService);
  taskService = inject(TaskService);
  logService = inject(LogService);

  projects = this.projectService.projects;
  tasks = this.taskService.tasksByProject;

  // Output event to emit filtered logs to parent component
  filteredLogs = output<LogEntry[]>();

  // Output event to emit loading state
  filterLoading = output<boolean>();

  selectedProjectId: number | null = null;
  selectedTaskId: number | null = null;
  showFilters = false;

  toggleFilters(){
    this.showFilters = !this.showFilters;
  }

  async setSelectedProject(projectId: number | null) {
    this.selectedProjectId = projectId;
    this.selectedTaskId = null; // Reset task selection when project changes
    await this.applyFilters();
  }

  async setSelectedTask(taskId: number | null) {
    this.selectedTaskId = taskId;
    await this.applyFilters();
  }

  async applyFilters() {
    try {
      this.filterLoading.emit(true);
      let logs: LogEntry[];

      if (this.selectedTaskId) {
        // If task is selected, fetch logs by task (most specific)
        logs = await this.logService.getLogsByTaskId(this.selectedTaskId);
        this.router.navigate(['/logs',this.selectedProjectId,this.selectedTaskId]);
      } else if (this.selectedProjectId) {
        // If only project is selected, fetch logs by project
        logs = await this.logService.getLogsByProjectId(this.selectedProjectId);
        this.router.navigate(['/logs',this.selectedProjectId]);
      } else {
        // No filters selected, fetch all logs
        logs = await this.logService.getLogs();
      }

      this.filteredLogs.emit(logs);
    } catch (error) {
      console.error('Error applying filters:', error);
      this.filteredLogs.emit([]);
    } finally {
      this.filterLoading.emit(false);
    }
  }

  async clearFilters() {
    this.selectedProjectId = null;
    this.selectedTaskId = null;
    await this.applyFilters(); // This will fetch all logs
  }
}