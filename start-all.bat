@echo off
chcp 65001 >nul
rem Windows full-stack start; implementation lives in scripts\start-all.mjs.
rem start.bat (bridge guard) is intentionally left unchanged.
node "%~dp0scripts\start-all.mjs" %*
set "QQB_EXIT=%errorlevel%"
rem Double-clicked from Explorer: the window would close at once and hide the
rem summary / error. Keep it open. Run from an open console (or QQB_NO_PAUSE=1)
rem and it exits straight away as before.
if not defined QQB_NO_PAUSE (
  echo %cmdcmdline% | findstr /i /c:"%~nx0" >nul && (
    echo.
    if not "%QQB_EXIT%"=="0" echo [start-all] FAILED - read the messages above.
    pause
  )
)
exit /b %QQB_EXIT%
