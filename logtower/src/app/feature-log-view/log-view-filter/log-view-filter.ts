import {Component, effect, inject, input, OnInit, output, Signal} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ProjectService} from "../../service/project.service";
import {TaskService} from "../../service/task.service";
import {ProjectModel} from "../../models/project.model";
import {TaskModel} from "../../models/task.model";

@Component({
  selector: 'app-log-view-filter',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './log-view-filter.html',
  styleUrl: './log-view-filter.css'
})
export class LogViewFilter implements OnInit{

  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  projects = this.projectService.projects;
  tasks = this.taskService.tasksByProject;

  filterLoading = output<boolean>();

  selectedProjectValue: ProjectModel | null = null;
  selectedTaskValue: TaskModel | null = null;
  selectedTaskId: number | null = null;

  // defaultProject = input<ProjectModel | null>(null);
  // defaultTask = input<TaskModel | null>(null);

  selectedProject = output<ProjectModel>();
  selectedTask = output<TaskModel>();
  showFilters = false;

  defaultTask = input.required<Signal<TaskModel | null>>();
  defaultProject = input.required<Signal<ProjectModel | null>>();
  constructor() {
    effect(() => {
      const project = this.defaultProject()?.(); // read project signal
      const task = this.defaultTask()?.();       // read task signal

      this.selectedProjectValue = project;
      this.selectedTaskValue = task;
    });
  }
  projectCompare = (a: ProjectModel | null, b: ProjectModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;

  taskCompare = (a: TaskModel | null, b: TaskModel | null) =>
      !!a && !!b ? a.id === b.id : a === b;
  ngOnInit() {
    // ✅ use an effect so it re-runs whenever the parent signal changes
    effect(() => {
      this.selectedProjectValue = this.defaultProject()();
      this.selectedTaskValue = this.defaultTask()();
    });
  }

  toggleFilters(){
    this.showFilters = !this.showFilters;
  }

  onProjectSelected($event: ProjectModel) {
    console.log("FILTER EMITS ",$event);
    this.selectedProject.emit($event);
  }

  onTaskSelected($event: TaskModel) {
    this.selectedTask.emit($event);
  }

  // async setSelectedProject(projectId: number | null) {
  //   this.selectedProjectId = projectId;
  //   this.selectedTaskId = null; // Reset task selection when project changes
  //   await this.applyFilters();
  // }

  async setSelectedTask(taskId: number | null) {
    this.selectedTaskId = taskId;
    await this.applyFilters();
  }

  async applyFilters() {

  }

  // async clearFilters() {
  //   this.selectedProjectId = null;
  //   this.selectedTaskId = null;
  //   await this.applyFilters(); // This will fetch all logs
  // }
}
