## Packages
framer-motion | Complex animations for timer, transitions, and layout
date-fns | Date formatting and calendar logic
@dnd-kit/core | Drag and drop for workflow builder
@dnd-kit/sortable | Sortable lists for workflow steps
@dnd-kit/utilities | Utilities for DnD
clsx | Class name utility
tailwind-merge | Class merging utility

## Notes
Timer logic needs to handle the "Buffer State" (10s extension window) entirely on client-side state before marking complete.
Workflows are sequences of tasks; execution state will be managed in the Dashboard view.
Calendar events map to either a Task or a Workflow via `type` and `referenceId`.
