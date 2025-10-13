import { Routes } from "@angular/router";
import {Dashboard} from "./dashboard/dashboard";
import {ViewLogs} from "./view-logs/view-logs";
import {Settings} from "./settings/settings";
import {QuickLog} from "./quick-log/quick-log";
import {ManageProjects} from "./manage-projects/manage-projects";
import {ViewLogsByProject} from "./view-logs/view-logs-by-project/view-logs-by-project";
import {ViewLogsByTask} from "./view-logs/view-logs-by-task/view-logs-by-task";

export const routes: Routes = [

    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    { path: 'dashboard', component: Dashboard },

    { path: 'logs', component: ViewLogs },

    { path: 'logs/:projectId', component: ViewLogsByProject},

    { path: 'logs/:projectId/:taskId', component: ViewLogsByTask},

    { path: 'settings', component: Settings },

    { path: 'quick-log', component: QuickLog },

    { path: 'manage', component: ManageProjects },

    { path: '**', redirectTo: 'dashboard' }
];
