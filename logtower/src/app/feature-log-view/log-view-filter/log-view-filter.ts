import { Component, effect, inject, model } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../service/project.service';
import { TaskService } from '../../service/task.service';
import { ProjectModel } from '../../models/project.model';
import { TaskModel } from '../../models/task.model';

@Component({
  selector: 'app-log-view-filter',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './log-view-filter.html',
  styleUrl: './log-view-filter.css'
})
export class LogViewFilter {

  // Services
  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  // Data signals
  projects = this.projectService.projects;
  tasks = this.taskService.tasksByProject;

  // Models (two-way bound to parent)
  project = model<ProjectModel | null>(null);
  task = model<TaskModel | null>(null);

  // UI state
  showFilters = false;

  // Compare helpers
  projectCompare = (a: ProjectModel | null, b: ProjectModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;

  taskCompare = (a: TaskModel | null, b: TaskModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  onProjectSelected(project: ProjectModel | null) {
    this.project.set(project);
    this.task.set(null); // reset task when project changes
  }

  onTaskSelected(task: TaskModel | null) {
    this.task.set(task);
  }

  clearFilters() {
    this.project.set(null);
    this.task.set(null);
  }
}
