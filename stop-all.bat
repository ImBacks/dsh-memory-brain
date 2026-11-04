@echo off
rem Thin entry: the logic lives in scripts\stop-all.mjs (shared by Linux and Windows).
rem Keep this file ASCII + CRLF. %cmdcmdline% and %~dp0 can hold ( ) & ^ ! so they must
rem never be expanded inside a parenthesized block: a stray ")" there is a syntax error,
rem and cmd.exe then closes a double-clicked window at once with nothing left to read.
setlocal DisableDelayedExpansion
chcp 65001 >nul 2>nul
set "QQB_SCRIPT=%~dp0scripts\stop-all.mjs"
set "QQB_EXIT=1"
if not exist "%QQB_SCRIPT%" goto no_script
node --version >nul 2>nul
if errorlevel 1 goto no_node
node "%QQB_SCRIPT%" %*
set "QQB_EXIT=%errorlevel%"
goto finish
:no_script
echo [stop-all] scripts\stop-all.mjs not found.
echo   Extract the whole zip into a folder first, then run stop-all.bat from that folder.
goto finish
:no_node
echo [stop-all] node was not found.
echo   Install Node.js 24 LTS from https://nodejs.org/ then open a new window and retry.
goto finish
:finish
if defined QQB_NO_PAUSE goto done
set "QQB_CMDLINE=%cmdcmdline:"=%"
if /i "%QQB_CMDLINE:stop-all.bat=%"=="%QQB_CMDLINE%" goto done
echo.
if not "%QQB_EXIT%"=="0" echo [stop-all] FAILED - read the messages above. Saved in %%USERPROFILE%%\.ai-companion-run\stop-all.log
pause
:done
exit /b %QQB_EXIT%
