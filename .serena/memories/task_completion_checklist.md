# Task Completion Checklist - SAB Lanyard

## Pre-Implementation
1. [ ] Read relevant code with symbolic tools (avoid reading entire files)
2. [ ] Understand current implementation
3. [ ] Plan changes with user confirmation
4. [ ] Create TODO list with manage_todo_list

## During Implementation
1. [ ] Follow code style conventions
2. [ ] Use constants for all magic numbers/strings
3. [ ] Add meaningful comments (WHY, not WHAT)
4. [ ] Remove any unused imports/variables
5. [ ] Handle errors explicitly (no silent failures)

## After Code Changes
1. [ ] Verify syntax (especially imports)
2. [ ] Check for unused code
3. [ ] Test changed functionality
4. [ ] Update related files if needed
5. [ ] Verify no breaking changes

## Before Git Commit
1. [ ] Run `git status` to check changes
2. [ ] Run `git diff --stat` for file statistics
3. [ ] Run `git diff --cached --stat` for staged changes
4. [ ] Propose commit message (< 50 chars total)
5. [ ] Provide detailed description with:
   - Summary
   - Changes (Added/Modified/Fixed/Removed)
   - Technical Details
   - Testing
   - Impact
   - Files Changed

## Cleanup
1. [ ] Delete temporary files in `.copilot_temp/`
2. [ ] Confirm cleanup with user

## Docker Compose Specific
- Use `compose.yml` (not `docker-compose.yml`)
- No `version` field in compose files
- Test with `docker-compose up --build`

## Package Manager
1. Check lock files to determine package manager:
   - `yarn.lock` → Use yarn
   - `pnpm-lock.yaml` → Use pnpm
   - `package-lock.json` → Use npm
   - No lock file → Use yarn (default)
