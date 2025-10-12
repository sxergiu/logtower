import { Routes } from "@angular/router";
import {Dashboard} from "./dashboard/dashboard";
import {ViewLogs} from "./view-logs/view-logs";
import {Settings} from "./settings/settings";
import {QuickLog} from "./quick-log/quick-log";
import {ManageProjects} from "./manage-projects/manage-projects";

export const routes: Routes = [

    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    { path: 'dashboard', component: Dashboard },

    { path: 'logs', component: ViewLogs },

    { path: 'settings', component: Settings },

    { path: 'quick-log', component: QuickLog },

    { path: 'manage', component: ManageProjects },

    { path: '**', redirectTo: 'dashboard' }
];
