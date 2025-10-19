import { Routes } from "@angular/router";
import {Dashboard} from "./dashboard/dashboard";
import {Settings} from "./settings/settings";
import {QuickLog} from "./quick-log/quick-log";
import {ManageProjects} from "./manage-projects/manage-projects";
import {LogView} from "./feature-log-view/log-view";

export const routes: Routes = [

    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    { path: 'dashboard', component: Dashboard },

    { path: 'settings', component: Settings },

    { path: 'quick-log', component: QuickLog },

    { path: 'log-view', component: LogView },

    { path: 'manage', component: ManageProjects },

    { path: '**', redirectTo: 'dashboard' }
];
