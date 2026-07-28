@echo off
REM Installs the itouOJ submit client on this machine.
REM Copies the exe to C:\itouOJ, removes the Mark-of-the-Web that makes
REM SmartScreen complain, and creates a desktop shortcut.
REM
REM Keep this .bat next to setup-machine.ps1, itouOJ-Submit.exe and the
REM manual HTML file.
REM
REM ASCII only in this file: cmd.exe reads .bat as the OEM codepage,
REM so UTF-8 text here would come out garbled.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-machine.ps1"
