@echo off
echo ================================================================================
echo REBUILDING FRONTEND - This will take 1-2 minutes
echo ================================================================================
echo.

cd client
echo Step 1/2: Building frontend...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo ✅ BUILD SUCCESSFUL!
    echo ================================================================================
    echo.
    echo Next steps:
    echo 1. The backend should already be running (npm run start:dev)
    echo 2. Refresh your browser (Ctrl+F5 or Ctrl+Shift+R)
    echo 3. Navigate to Admin Dashboard → Users
    echo 4. You should now see the 🪙 (coin) icon buttons!
    echo.
    echo ================================================================================
) else (
    echo.
    echo ================================================================================
    echo ❌ BUILD FAILED!
    echo ================================================================================
    echo Please check the error messages above.
    echo.
)

pause
