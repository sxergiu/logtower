# logtower - personal desktop logging app

>Tauri is a framework for building tiny, blazing fast binaries for all major desktop platforms.
>Developers can integrate any front-end framework that compiles to HTML, JS and CSS for building their user interface.
>The backend of the application is a rust-sourced binary with an API that the front-end can interact with.
Tasks:

>#### [ISSUE] Handling no selected project/task -> probably disabling quicklog + prompt user to select setup
>#### [DECISION] Remove setup page and enable setup selection in quicklog?
>#### Possible solutions:
> - automatically selecting one / ce faci daca nu ai deloc?
> 
> - nu poti da log fara sa le ai selectate, quicklog change setup
>   - reactive form with validators for unselected setup
> - lasi unknown task / implement change log msg/task/project 
>#### [FEATURE] log view/filter -> signal store
>#### [ADDON] table scrollbar
>#### [ADDON] responsiveness?
> 
>#### [DEPLOYMENT]? cross-platform issues
>#### [ADDON] handling startup cases/empty cases
>#### [ADDON] codebase cleanup

