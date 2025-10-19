import { Component, inject} from '@angular/core';
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
    showModal = false;

    constructor() {
        this.store.fetchAllLogs();
    }

    onProjectSelected(project: ProjectModel | null) {
        if( project ) {
            this.store.resetTask();
            this.store.fetchLogsByProject(project);
            this.isProjectView = true;
            this.isTaskView = false;
        }
        else {
            this.store.fetchAllLogs();
            this.isProjectView = false;
            this.isTaskView = false;
        }
    }

    onTaskSelected(task: TaskModel | null) {
        if( task ) {
            this.store.fetchLogsByTask(task);
            this.isTaskView = true;
        }
        else {
            this.store.fetchAllLogs();
            this.isTaskView = false;
            this.isProjectView = false;
        }
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

    onEditLog(event: { id: number; newMessage: string }) {
        this.store.editLog(event);
    }

    onDeleteLog(logId: number) {
        this.store.deleteLog(logId);
    }

    deleteLogs() {

        if( this.isTaskView ) {
            const task = this.store.selectedTask();
            if (task) this.store.deleteLogsByTask(task);
        }
        else if( this.isProjectView ) {
            const project = this.store.selectedProject();
            if (project) this.store.deleteLogsByProject(project);
        }
        else {
            this.store.deleteAllLogs();
        }
        this.cancelDelete();
    }

    openDeleteModal() {
        this.showModal = true;
    }

    cancelDelete() {
        this.showModal = false;
    }

    showLoader = false;
    isVisible = false;

    showLoading() {
        this.showLoader = true;
        setTimeout(() => (this.isVisible = true), 10); // triggers fade-in
    }

    hideLoading() {
        this.isVisible = false; // triggers fade-out
        setTimeout(() => (this.showLoader = false), 300); // wait for fade-out
    }

}
