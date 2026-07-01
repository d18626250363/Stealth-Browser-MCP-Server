@echo off
title Electron Stealth - MCP Browser
echo ============================================================
echo   Electron Stealth - Stealth Browser + MCP Server
echo   TCP MCP: 127.0.0.1:19999
echo ============================================================
echo.
echo Starting Electron Stealth...
start "" "%~dp0dist\win-unpacked\Electron Stealth.exe"
echo.
echo Electron Stealth launched. MCP server will be ready in a few seconds.
echo Connect with Claude Code: node bridge.js (from this directory)
echo.
pause
