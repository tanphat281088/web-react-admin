@echo off
setlocal

REM ====== ĐƯỜNG DẪN CỦA BẠN ======
set "PROJECT_DIR=H:\Desktop2\Final Software\REACT-ADMIN"

REM ====== CHUẨN BỊ ======
set "BACKUP_DIR=%PROJECT_DIR%\_backups"
for /f %%i in ('powershell -NoP -C "(Get-Date).ToString(\"yyyyMMdd_HHmm\")"') do set "TS=%%i"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

pushd "%PROJECT_DIR%" 2>nul
if errorlevel 1 (
  echo [ERROR] PROJECT_DIR khong ton tai: %PROJECT_DIR%
  goto :END
)

REM ====== GIT SNAPSHOT (nếu có .git) ======
if exist ".git" (
  git add -A
  git commit -m "backup: %TS%" >nul 2>&1
  git branch "backup-%TS%" >nul 2>&1
  git tag "v-backup-%TS%" >nul 2>&1
  echo [OK] Git snapshot: backup-%TS% / v-backup-%TS%
) else (
  echo [WARN] Khong thay .git -> bo qua Git snapshot.
)

REM ====== ZIP .env/.env.local (neu co) ======
if exist ".env" (
  powershell -NoLogo -NoProfile -Command ^
    "Compress-Archive -Path '.env','.env.local' -DestinationPath '%BACKUP_DIR%\env_%TS%.zip' -Force" ^
    && echo [OK] Zip env: %BACKUP_DIR%\env_%TS%.zip ^
    || echo [WARN] Nen env loi.
) else (
  echo [WARN] Khong thay .env trong frontend.
)

:END
popd 2>nul
echo.
echo Done. Backups in: %BACKUP_DIR%
pause
endlocal
