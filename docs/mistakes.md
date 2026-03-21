# Mistakes & Lessons Learned

This document serves as our long-term memory for missteps, anti-patterns, and bugs encountered during development. 

**Rule:** Every time a significant error is made, a new entry must be added here outlining the mistake and the prevention strategy. Before starting a complex task, review this list.

| Date | Mistake | Root Cause | Prevention Strategy |
| :--- | :--- | :--- | :--- |
| YYYY-MM-DD | Example: PWA chosen for Worker App initially | PWAs cannot reliably deliver background push notifications on low-end Android OS. | Transitioned to React Native (Expo) instead. Always verify hardware constraints of end users. |

-- Add new entries below this line --
