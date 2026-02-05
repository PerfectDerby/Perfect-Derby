# Deployment Guide

How to deploy a stable version of the game to a separate GitHub account while maintaining your main development workflow.

## The Strategy
Instead of changing your current project settings (which could break your daily workflow), we will:
1.  **Export** a "clean" copy of the game files to a new folder on your computer.
2.  **Initialize** a completely fresh Git repository in that new folder.
3.  **Push** that fresh folder to the new GitHub account.

## Step 1: Run the Export Script
I have created a helper script to do the heavy lifting (copying files while ignoring the massive `node_modules` and hidden `.git` history).

Run this command in your terminal:
```powershell
.\tools\export_stable.ps1
```

This will create a new folder called `baseball-game-public` alongside your current project folder.

## Step 2: Push to New GitHub
1.  Go to **GitHub.com** on the new account.
2.  Create a **New Repository** (empty).
3.  Copy the URL (e.g., `https://github.com/StartUpInc/baseball-public.git`).

Now, open your terminal to the new folder and push:

```powershell
# 1. Go to the new clean folder
cd ..\baseball-game-public

# 2. Start a fresh git history
git init
git add .
git commit -m "Initial Release v1.0"

# 3. Connect to the NEW GitHub
git branch -M main
git remote add origin https://github.com/YOUR_NEW_ACCOUNT/YOUR_NEW_REPO.git

# 4. Push (You may be prompted to sign in)
git push -u origin main
```

## Step 3: Enable Playable Link
1.  On the new GitHub repository page, go to **Settings**.
2.  Click **Pages** (on the left sidebar).
3.  Under **Build and deployment**, select Source: **Deploy from a branch**.
4.  Select Branch: **main** / **root**.
5.  Click **Save**.

Wait about 60 seconds, and GitHub will give you a playable link (e.g., `https://your-new-account.github.io/baseball-public/`).
