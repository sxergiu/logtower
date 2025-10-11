import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";
import {Project} from "../../models/project.model";
import {FormsModule} from "@angular/forms";
import {SettingsService} from "../../service/settings.service";

@Component({
  selector: 'app-manage-projects',
  imports: [
    FormsModule,
  ],
  templateUrl: './manage-projects.html',
  styleUrl: './manage-projects.css'
})
export class ManageProjects {

  settingsService = inject(SettingsService);
  router = inject(Router);

  projects = this.settingsService.projects;
  tasksByProject =  this.settingsService.tasksByProject;

  newProjectName = '';
  newTaskNames: { [key: number]: string } = {};

  addProject(): void {
    if (this.newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now(),
        name: this.newProjectName,
        createdAt: new Date().toISOString()
      };
      this.projects.set([...this.projects(), newProject]);
      this.newProjectName = '';
    }
  }
  goToSettings() {
    this.router.navigate(['settings']);
  }
}
