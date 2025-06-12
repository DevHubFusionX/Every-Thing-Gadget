@echo off
echo Setting up GitHub repository for Everything-Tech...

REM Create a new repository on GitHub first, then run this script

REM Replace these variables with your GitHub information
set GITHUB_USERNAME=your-username
set REPO_NAME=Everything-Tech

REM Initialize Git repository
git init

REM Remove any existing embedded Git repositories
rmdir /s /q "Everthing-Tech\.git" 2>nul
rmdir /s /q "backend\.git" 2>nul

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit with Cloudinary integration"

REM Add GitHub remote
git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

REM Push to GitHub
git push -u origin master

echo Done! Your code is now on GitHub at https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
pause