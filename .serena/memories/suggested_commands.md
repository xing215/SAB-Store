# Suggested Commands - SAB Lanyard

## Development Commands

### Backend
```powershell
cd backend
npm install              # Install dependencies
npm run dev             # Start dev server with nodemon (port 5000)
npm start               # Start production server
npm run init-db         # Initialize database
npm test                # Run tests
```

### Frontend
```powershell
cd frontend
npm install             # Install dependencies
npm start               # Start dev server (port 3000)
npm run build           # Build for production
npm test                # Run tests
```

### Docker
```powershell
docker-compose up --build        # Build and start all services
docker-compose up -d --build     # Background mode
docker-compose down              # Stop all services
docker-compose logs -f           # Follow logs
docker-compose restart           # Restart services
```

## Windows System Commands
```powershell
ls                      # List directory (PowerShell alias for Get-ChildItem)
cd <path>               # Change directory
pwd                     # Print working directory (PowerShell alias for Get-Location)
cat <file>              # View file content (PowerShell alias for Get-Content)
Select-String "pattern" <file>  # Grep equivalent
Get-ChildItem -Recurse -Filter "*.js"  # Find files
```

## Git Commands
```powershell
git status
git add .
git commit -m "message"
git push
git pull
git diff
git log --oneline
```

## Testing & Validation
```powershell
# Backend validation
cd backend
npm test

# Frontend validation
cd frontend
npm test
npm run build  # Ensure build succeeds
```

## Database
MongoDB runs on port 27017 (configured in Docker Compose)
- Database name: minipreorder_db
- Connection: mongodb://localhost:27017/minipreorder_db
