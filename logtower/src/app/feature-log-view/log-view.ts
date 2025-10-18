import {AfterViewInit, Component, inject} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {Router} from "@angular/router";
import {LogViewFilter} from "./log-view-filter/log-view-filter";
import {LogViewTable} from "./log-view-table/log-view-table";
import {SettingsDrawer} from "../settings-drawer/settings-drawer";
import {featureLogViewStore} from "./+store/feature-log-view.store";
import {ProjectModel} from "../models/project.model";
import {TaskModel} from "../models/task.model";

@Component({
  selector: 'app-log-view',
    imports: [
        NgOptimizedImage,
        LogViewTable,
        SettingsDrawer,
        LogViewFilter,
    ],
  templateUrl: './log-view.html',
  styleUrl: './log-view.css',
    providers: [featureLogViewStore]
})
export class LogView {

    router = inject(Router);
    store = inject(featureLogViewStore);

    isProjectView = false;
    isTaskView = false;

    constructor() {
        this.store.fetchAllLogs();
    }

    onProjectSelected(project: ProjectModel) {
        this.store.fetchLogsByProject(project);
        this.store.resetTask();
        this.isProjectView = true;
        this.isTaskView = false;
    }

    onTaskSelected($event: TaskModel) {
        this.store.fetchLogsByTask($event);
        this.isTaskView = true;
    }

    goToDashboard() {
        this.router.navigate(['/dashboard']);
    }

    onProjectBadgeSelected($event: number) {
        this.store.fetchLogsByProjectId($event);
        this.isProjectView = true;
        this.isTaskView = false;
    }

    onTaskBadgeSelected($event: number) {
        this.store.fetchLogsByTaskId($event);
        this.isProjectView = true;
        this.isTaskView = true;
    }
}
