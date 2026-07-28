@echo off
REM Installs the itouOJ submit client on this machine.
REM Copies the exe to C:\itouOJ, removes the Mark-of-the-Web that makes
REM SmartScreen complain, and creates a desktop shortcut.
REM
REM Keep this .bat next to setup-machine.ps1 and itouOJ-Submit.exe.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-machine.ps1"
