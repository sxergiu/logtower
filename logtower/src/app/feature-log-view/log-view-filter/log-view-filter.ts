import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { ProjectService } from '../../service/project.service';
import { TaskService } from '../../service/task.service';
import { ProjectModel } from '../../models/project.model';
import { TaskModel } from '../../models/task.model';

@Component({
  selector: 'app-log-view-filter',
  standalone: true,
  imports: [NgOptimizedImage, FormsModule],
  templateUrl: './log-view-filter.html',
  styleUrl: './log-view-filter.css'
})
export class LogViewFilter {

  // Services
  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  // Reactive data
  projects = this.projectService.projects;
  tasks = this.taskService.tasksByProject;

  // Models bound to parent
  project = model<ProjectModel | null>(null);
  task = model<TaskModel | null>(null);

  showFilters = false;

  // Compare helpers
  projectCompare = (a: ProjectModel | null, b: ProjectModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;

  taskCompare = (a: TaskModel | null, b: TaskModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // Called when selecting a project in the dropdown
  onProjectSelected(project: ProjectModel | null) {
    this.project.set(project);      // update local signal
    this.task.set(null);            // clear selected task

    // ⚡ propagate change back to parent (triggers (projectChange))
    this.project.update(() => project);
    // also tell parent the task was reset (triggers (taskChange))
    this.task.update(() => null);
  }

  // Called when selecting a task in the dropdown
  onTaskSelected(task: TaskModel | null) {
    this.task.set(task);
    this.task.update(() => task); // trigger (taskChange)
  }

  // Clear both filters
  clearFilters() {
    this.project.set(null);
    this.task.set(null);
    this.project.update(() => null);
    this.task.update(() => null);
  }
}
