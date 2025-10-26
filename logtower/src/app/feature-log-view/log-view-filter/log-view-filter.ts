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

  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  projects = this.projectService.projects;
  tasks = this.taskService.tasksByProject;
  project = model<ProjectModel | null>(null);
  task = model<TaskModel | null>(null);

  showFilters = false;

  projectCompare = (a: ProjectModel | null, b: ProjectModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;

  taskCompare = (a: TaskModel | null, b: TaskModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  onProjectSelected(project: ProjectModel | null) {
    this.project.set(project);
    this.task.set(null);

    this.project.update(() => project);
    this.task.update(() => null);
  }

  onTaskSelected(task: TaskModel | null) {
    this.task.set(task);
    this.task.update(() => task);
  }

  clearFilters() {
    this.project.set(null);
    this.task.set(null);
    this.project.update(() => null);
    this.task.update(() => null);
  }
}
