# Required header framework for structural logic commands
!include "LogicLib.nsh"

# GLOBAL CONFIGURATION FLAGS (Must be outside of macros/functions)
ShowInstDetails show
ShowUninstDetails show

!macro customInit
  DetailPrint "Initializing 24Flight Desktop Installer..."
!macroend

!macro customInstall
  DetailPrint "========================================="
  DetailPrint " Initializing 24Flight Dependency Setup"
  DetailPrint "========================================="
  Sleep 1000

  # Verify if destination assets are accurately written
  IfFileExists "$INSTDIR\resources\install-deps\win\*.*" process_deps folder_missing

folder_missing:
  DetailPrint "Dependency architecture path missing. Skipping framework setup."
  Goto setup_complete

process_deps:
  ; ----------------------------------------------------
  ; DEPENDENCY 1: Oracle JDK 26 Runtime Engine
  ; ----------------------------------------------------
  IfFileExists "$INSTDIR\resources\install-deps\win\jdk-26_windows-x64_bin.exe" run_jdk skip_jdk

run_jdk:
  DetailPrint "[Found Dependency] -> Processing: Oracle JDK 26..."
  ExecWait '"$INSTDIR\resources\install-deps\win\jdk-26_windows-x64_bin.exe" /s'
  DetailPrint "Java Environment successfully configured."
  Goto check_arch

skip_jdk:
  DetailPrint "[Skipping] -> jdk-26_windows-x64_bin.exe not present."

check_arch:
  ; ----------------------------------------------------
  ; ARCHITECTURE DETERMINATION LOGIC
  ; ----------------------------------------------------
  ${If} ${RunningX64}
    DetailPrint "64-bit Architecture detected. Queuing dual VC Redist x86 & x64 execution..."
    Goto install_vc86_for_x64
  ${Else}
    DetailPrint "32-bit Architecture detected. Queuing single VC Redist x86 execution..."
    Goto install_vc86_only
  ${EndIf}

; ----------------------------------------------------
; 64-BIT DUAL-INSTALLATION PATH
; ----------------------------------------------------
install_vc86_for_x64:
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" run_vc86_for_x64 skip_vc86_for_x64
run_vc86_for_x64:
  DetailPrint "[Processing 64-bit System] -> Part 1/2: Visual C++ Runtime (x86)..."
  ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" /q /norestart'
skip_vc86_for_x64:
  Goto install_vc64_for_x64

install_vc64_for_x64:
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x64.exe" run_vc64_for_x64 setup_complete
run_vc64_for_x64:
  DetailPrint "[Processing 64-bit System] -> Part 2/2: Visual C++ Runtime (x64)..."
  ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x64.exe" /q /norestart'
  Goto setup_complete

; ----------------------------------------------------
; 32-BIT SINGLE-INSTALLATION PATH
; ----------------------------------------------------
install_vc86_only:
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" run_vc86_only setup_complete
run_vc86_only:
  DetailPrint "[Processing 32-bit System] -> Visual C++ Runtime (x86)..."
  ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" /q /norestart'
  Goto setup_complete

setup_complete:
  DetailPrint "========================================="
  DetailPrint " System Architecture Setup Complete! "
  DetailPrint "========================================="
  Sleep 1000
!macroend
