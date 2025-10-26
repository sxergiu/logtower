import {
    patchState,
    signalStore,
    withState,
    withComputed,
    withHooks,
    withMethods
} from '@ngrx/signals';
import { computed, effect, inject } from '@angular/core';
import { LogService } from '../../service/log.service';
import { LogModel } from '../../models/log.model';
import { ProjectModel } from '../../models/project.model';
import { TaskModel } from '../../models/task.model';
import { catchError, delay, EMPTY, finalize, from, pipe, switchMap, tap, Observable } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ProjectService } from '../../service/project.service';
import { TaskService } from '../../service/task.service';

export interface LogFilterState {
    loading: number;
    logs: LogModel[];
    selectedProject: ProjectModel | null;
    selectedTask: TaskModel | null;
    showFilters: boolean;
}

const delayTime = 0;

export const featureLogViewStore = signalStore(
    withState<LogFilterState>({
        loading: 0,
        logs: [],
        selectedProject: null,
        selectedTask: null,
        showFilters: false
    }),

    withComputed((state) => ({
        logs: computed(() => state.logs()),
        hideProjectColumn: computed(() => !!state.selectedProject()),
        hideTaskColumn: computed(() => !!state.selectedTask()),
        filteredLogs: computed<LogModel[]>(() => {
            const project = state.selectedProject();
            const task = state.selectedTask();
            const all = state.logs();

            if (task) return all.filter((l) => l.task_id === task.id);
            if (project) return all.filter((l) => l.project_id === project.id);
            return all;
        })
    })),

    withMethods((state,
                 logService = inject(LogService),
                 projectService = inject(ProjectService),
                 taskService = inject(TaskService)) => {

        const inc = () => patchState(state, { loading: state.loading() + 1 });
        const dec = () => patchState(state, { loading: state.loading() - 1 });

        const wrap = <T>(obs$: Observable<T>, label: string) =>
            obs$.pipe(
                delay(delayTime),
                catchError((err) => {
                    console.error(label, err);
                    return EMPTY;
                }),
                finalize(dec)
            );

        const setProject = (project: ProjectModel | null) =>
            patchState(state, { selectedProject: project, selectedTask: null });

        const setTask = (task: TaskModel | null) =>
            patchState(state, { selectedTask: task });

        const reloadBySelection = () => {
            const p = state.selectedProject();
            const t = state.selectedTask();
            if (p) return from(logService.getLogsByProjectId(p.id));
            if (t) return from(logService.getLogsByTaskId(t.id));
            return from(logService.getLogs());
        };

        const loadLogs = (src$: Observable<LogModel[]>, label: string) =>
            wrap(
                src$.pipe(tap((logs) => patchState(state, { logs }))),
                label
            );

        return {
            fetchAllLogs: rxMethod<void>(
                pipe(
                    tap(inc),
                    switchMap(() => loadLogs(from(logService.getLogs()), 'Error fetching logs'))
                )
            ),

            fetchLogsByProject: rxMethod<ProjectModel>(
                pipe(
                    tap((project) => {
                        inc();
                        setProject(project);
                    }),
                    switchMap((project) =>
                        loadLogs(
                            from(logService.getLogsByProjectId(project.id)),
                            'Error fetching logs by project'
                        )
                    )
                )
            ),

            fetchLogsByProjectId: rxMethod<number>(
                pipe(
                    tap(() => {
                        inc();
                        patchState(state, { selectedTask: null });
                    }),
                    switchMap((projectId) =>
                        from(projectService.getProjectById(projectId)).pipe(
                            tap((project) => setProject(project)),
                            switchMap(() =>
                                loadLogs(
                                    from(logService.getLogsByProjectId(projectId)),
                                    'Error fetching logs by project ID'
                                )
                            ),
                            catchError((err) => {
                                console.error('Error fetching project by ID:', err);
                                dec();
                                return EMPTY;
                            })
                        )
                    )
                )
            ),

            fetchLogsByTask: rxMethod<TaskModel>(
                pipe(
                    tap((task) => {
                        inc();
                        setTask(task);
                    }),
                    switchMap((task) =>
                        loadLogs(
                            from(logService.getLogsByTaskId(task.id)),
                            'Error fetching logs by task'
                        )
                    )
                )
            ),

            fetchLogsByTaskId: rxMethod<number>(
                pipe(
                    tap(() => {
                        inc();
                        patchState(state, { selectedProject: null });
                    }),
                    switchMap((taskId) =>
                        from(taskService.getTaskById(taskId)).pipe(
                            switchMap((task) => {
                                if (!task) {
                                    console.error('Task not found');
                                    dec();
                                    return EMPTY;
                                }

                                const project$ = task.project_id
                                    ? from(projectService.getProjectById(task.project_id))
                                    : from(Promise.resolve(null));

                                return project$.pipe(
                                    tap((project) => {
                                        setTask(task);
                                        patchState(state, { selectedProject: project });
                                    }),
                                    switchMap(() =>
                                        loadLogs(
                                            from(logService.getLogsByTaskId(task.id)),
                                            'Error fetching logs by task ID'
                                        )
                                    )
                                );
                            }),
                            catchError((err) => {
                                console.error('Error fetching task by ID:', err);
                                dec();
                                return EMPTY;
                            })
                        )
                    )
                )
            ),

            editLog: rxMethod<{ id: number; newMessage: string }>(
                pipe(
                    tap(() => {
                        inc();
                    }),
                    tap(({ id, newMessage }) => {
                        patchState(state, {
                            logs: state.logs().map((l) => (l.id === id ? { ...l, message: newMessage } : l))
                        });
                    }),
                    switchMap(({ id, newMessage }) =>
                        wrap(from(logService.editLog(id, newMessage)), 'Error editing log')
                    )
                )
            ),

            deleteLog: rxMethod<number>(
                pipe(
                    tap(inc),
                    switchMap((logId) =>
                        from(logService.deleteLogById(logId)).pipe(
                            switchMap(reloadBySelection),
                            tap((logs) => patchState(state, { logs })),
                            catchError((err) => {
                                console.error('Error deleting log:', err);
                                return EMPTY;
                            }),
                            finalize(dec)
                        )
                    )
                )
            ),

            deleteAllLogs: rxMethod<void>(
                pipe(
                    tap(inc),
                    switchMap(() =>
                        from(logService.deleteAllLogs()).pipe(
                            switchMap(() => from(logService.getLogs())),
                            tap((logs) => patchState(state, { logs })),
                            catchError((err) => {
                                console.error('Error deleting all logs:', err);
                                return EMPTY;
                            }),
                            finalize(dec)
                        )
                    )
                )
            ),

            deleteLogsByProject: rxMethod<ProjectModel>(
                pipe(
                    tap(inc),
                    switchMap((project) =>
                        from(logService.deleteLogsByProjectId(project.id)).pipe(
                            switchMap(() => from(logService.getLogsByProjectId(project.id))),
                            tap((logs) =>
                                patchState(state, { logs, selectedProject: project, selectedTask: null })
                            ),
                            catchError((err) => {
                                console.error('Error deleting logs by project:', err);
                                return EMPTY;
                            }),
                            finalize(dec)
                        )
                    )
                )
            ),

            deleteLogsByTask: rxMethod<TaskModel>(
                pipe(
                    tap(inc),
                    switchMap((task) =>
                        from(logService.deleteLogsByTaskId(task.id)).pipe(
                            switchMap(() => from(logService.getLogsByTaskId(task.id))),
                            tap((logs) => patchState(state, { logs, selectedTask: task })),
                            catchError((err) => {
                                console.error('Error deleting logs by task:', err);
                                return EMPTY;
                            }),
                            finalize(dec)
                        )
                    )
                )
            ),

            setSelectedProject: (project: ProjectModel | null) => setProject(project),
            setSelectedTask: (task: TaskModel | null) => setTask(task),
            resetTask: () => setTask(null)
        };
    }),

    withHooks({
        onInit(store) {
            const logService = inject(LogService);

            store.fetchAllLogs();

            effect(() => {
                const allLogs = logService.logs();
                const project = store.selectedProject();
                const task = store.selectedTask();

                if (task) {
                    patchState(store, { logs: allLogs.filter((l) => l.task_id === task.id) });
                } else if (project) {
                    patchState(store, { logs: allLogs.filter((l) => l.project_id === project.id) });
                } else {
                    patchState(store, { logs: allLogs });
                }
            });
        }
    })
);
