import {Component, inject} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {Project} from "../../models/project.model";
import {TaskEntry} from "../../models/task-entry.model";
import {ProjectService} from "../../service/project.service";
import {TaskService} from "../../service/task.service";

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

  projectService = inject(ProjectService);
  taskService = inject(TaskService);

  projects = this.projectService.projects;
  tasks = this.taskService.tasksByProject;

  selectedProjectId: number = -1;
  selectedTask: TaskEntry | null = null;
  showFilters = false;

  toggleFilters(){
    this.showFilters = !this.showFilters;
  }

  setSelectedProject($event: any) {
    this.selectedProjectId = $event;
  }

  setSelectedTask($event: any) {
    this.selectedTask = $event;
  }
}
