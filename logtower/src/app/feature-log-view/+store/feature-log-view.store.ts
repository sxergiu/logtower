import {
    patchState,
    signalStore,
    withState,
    withComputed,
    withHooks,
    withMethods
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { LogService } from '../../service/log.service';
import { LogModel } from '../../models/log.model';
import { ProjectModel } from '../../models/project.model';
import { TaskModel } from '../../models/task.model';
import {catchError, EMPTY, finalize, from, pipe, switchMap, tap} from "rxjs";
import {rxMethod} from "@ngrx/signals/rxjs-interop";
import {ProjectService} from "../../service/project.service";
import {TaskService} from "../../service/task.service";


export type ViewContext = 'all' | 'project' | 'task';

export interface LogFilterState {
    loading: number;
    logs: LogModel[];
    selectedProject: ProjectModel | null;
    selectedTask: TaskModel | null;
    viewContext: ViewContext;
    showFilters: boolean;
}

export const featureLogViewStore = signalStore(

    withState<LogFilterState>({
        loading: 0,
        logs: [],
        selectedProject: null,
        selectedTask: null,
        viewContext: 'all',
        showFilters: false
    }),

    withComputed((state) => ({
        isLoading: computed(() => state.loading() > 0),
        logs: computed(() => state.logs()),
        pageTitle: computed(() => {
            if (state.selectedTask()) return `Logs: ${state.selectedTask()!.name}`;
            if (state.selectedProject()) return `Logs: ${state.selectedProject()!.name}`;
            return 'All Logs';
        }),
        showProjectColumn: computed(() => state.viewContext() !== 'project'),
        showTaskColumn: computed(() => state.viewContext() === 'all'),

        logsByProject: computed<LogModel[]>(() => {
            const project = state.selectedProject();
            if (!project) return state.logs();
            return state.logs().filter((log) => log.project_id === project.id);
        }),

        logsByTask: computed<LogModel[]>(() => {
            const task = state.selectedTask();
            if (!task) return state.logs();
            return state.logs().filter((log) => log.task_id === task.id);
        }),

        filteredLogs: computed<LogModel[]>(() => {
            const context = state.viewContext();
            const project = state.selectedProject();
            const task = state.selectedTask();

            if (context === 'project' && project) {
                return state.logs().filter(log => log.project_id === project.id);
            }

            if (context === 'task' && task) {
                return state.logs().filter(log => log.task_id === task.id);
            }

            return state.logs();
        })

    })),

    withMethods((state, logService = inject(LogService),
                 projectService = inject(ProjectService), taskService = inject(TaskService)) => ({

        fetchAllLogs: rxMethod<void>(
            pipe(
                tap(() => patchState(state, { loading: state.loading() + 1 })),
                switchMap(() => from(logService.getLogs()).pipe(
                    tap((logs) => patchState(state, { logs })),
                    catchError((error) => {
                        console.error('Error fetching logs:', error);
                        return EMPTY;
                    }),
                    finalize(() => patchState(state, { loading: state.loading() - 1 }))
                ))
            )
        ),

        fetchLogsByProject: rxMethod<ProjectModel>(
            pipe(
                tap((project) => patchState(state, {
                    loading: state.loading() + 1,
                    selectedProject: project,
                    selectedTask: null,
                    viewContext: 'project'
                })),
                switchMap((project) => from(logService.getLogsByProjectId(project.id)).pipe(
                    tap((logs) => patchState(state, { logs })),
                    catchError((error) => {
                        console.error('Error fetching logs by project:', error);
                        return EMPTY;
                    }),
                    finalize(() => patchState(state, { loading: state.loading() - 1 }))
                ))
            )
        ),

        fetchLogsByProjectId: rxMethod<number>(
            pipe(
                tap(() =>
                    patchState(state, {
                        loading: state.loading() + 1,
                        selectedTask: null,
                        viewContext: 'project'
                    })
                ),

                switchMap((projectId) =>
                    from(projectService.getProjectById(projectId)).pipe(
                        // ✅ Directly update selectedProject here
                        tap((project) =>
                            patchState(state, { selectedProject: project })
                        ),

                        switchMap(() =>
                            from(logService.getLogsByProjectId(projectId)).pipe(
                                tap((logs) => patchState(state, { logs })),
                                catchError((error) => {
                                    console.error('Error fetching logs by project ID:', error);
                                    return EMPTY;
                                }),
                                finalize(() =>
                                    patchState(state, { loading: state.loading() - 1 })
                                )
                            )
                        ),

                        catchError((error) => {
                            console.error('Error fetching project by ID:', error);
                            patchState(state, { loading: state.loading() - 1 });
                            return EMPTY;
                        })
                    )
                )
            )
        ),



        fetchLogsByTask: rxMethod<TaskModel>(
            pipe(
                tap((task) => patchState(state, {
                    loading: state.loading() + 1,
                    selectedTask: task,
                    viewContext: 'task'
                })),
                switchMap((task) => from(logService.getLogsByTaskId(task.id)).pipe(
                    tap((logs) => patchState(state, { logs })),
                    catchError((error) => {
                        console.error('Error fetching logs by task:', error);
                        return EMPTY;
                    }),
                    finalize(() => patchState(state, { loading: state.loading() - 1 }))
                ))
            )
        ),

        fetchLogsByTaskId: rxMethod<number>(
            pipe(
                tap(() =>
                    patchState(state, {
                        loading: state.loading() + 1,
                        selectedProject: null,
                        viewContext: 'task'
                    })
                ),

                switchMap((taskId) =>
                    // Step 1️⃣ – fetch the task
                    from(taskService.getTaskById(taskId)).
                        pipe(
                        tap((task) => console.log('Fetched task: ', task)),
                        switchMap((task) => {
                            if (!task) {
                                console.error('Task not found');
                                patchState(state, { loading: state.loading() - 1 });
                                return EMPTY;
                            }

                            // Step 2️⃣ – fetch the task’s project (if it has one)
                            const project$ = task.project_id
                                ? from(projectService.getProjectById(task.project_id))
                                : from(Promise.resolve(null));

                            return project$.pipe(
                                tap((project) => {
                                    console.log('Fetched project:', project);
                                    patchState(state, {
                                        selectedTask: task,
                                        selectedProject: project
                                    });
                                }),


                                // Step 4️⃣ – now fetch logs for this task
                                switchMap(() =>
                                    from(logService.getLogsByTaskId(task.id)).pipe(
                                        tap((logs) => patchState(state, { logs })),
                                        catchError((error) => {
                                            console.error('Error fetching logs by task ID:', error);
                                            return EMPTY;
                                        }),
                                        finalize(() =>
                                            patchState(state, { loading: state.loading() - 1 })
                                        )
                                    )
                                )
                            );
                        }),

                        catchError((error) => {
                            console.error('Error fetching task by ID:', error);
                            patchState(state, { loading: state.loading() - 1 });
                            return EMPTY;
                        })
                    )
                )
            )
        ),


        setSelectedProject: (project: ProjectModel | null) => {
            patchState(state, {
                selectedProject: project,
                selectedTask: null,
                viewContext: project ? 'project' : 'all'
            });
        },

        setSelectedTask: (task: TaskModel | null) => {
            patchState(state, {
                selectedTask: task,
                viewContext: task ? 'task' : 'all'
            });
        },


        resetTask: () => {
            patchState(state, {
                selectedTask: null,
            })
        }
    })),

    // 🔹 Lifecycle Hooks
    withHooks({
        // Automatically load logs on store initialization
        onInit({ fetchAllLogs }) {
            fetchAllLogs();
        }
    })
);
