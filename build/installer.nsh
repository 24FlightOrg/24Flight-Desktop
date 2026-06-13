!macro customInstall
  SetDetailsView show
  DetailPrint "========================================="
  DetailPrint "   Initializing 24Flight Dependency Setup"
  DetailPrint "========================================="
  Sleep 1000

  ; Verify the window infrastructure path exists
  IfFileExists "$INSTDIR\resources\install-deps\win\*.*" process_deps folder_missing

folder_missing:
  DetailPrint "Dependency architecture path missing. Skipping framework setup."
  Goto setup_complete

process_deps:
  ; ----------------------------------------------------
  ; DEPENDENCY 1: Oracle JDK 26 Runtime Engine
  ; ----------------------------------------------------
  IfFileExists "$INSTDIR\resources\install-deps\win\jdk-26_windows-x64_bin.exe" 0 skip_jdk
    DetailPrint "[Found Dependency] -> Processing: Oracle JDK 26..."
    Sleep 500
    DetailPrint "Deploying Java development environment components..."
    ; /s is the universal silent flag for Oracle JDK installers
    ExecWait '"$INSTDIR\resources\install-deps\win\jdk-26_windows-x64_bin.exe" /s'
    DetailPrint "Java Environment successfully configured."
    Goto next_dep_1
  skip_jdk:
    DetailPrint "[Skipping] -> jdk-26_windows-x64_bin.exe not present."
  next_dep_1:
    Sleep 500

  ; ----------------------------------------------------
  ; DEPENDENCY 2: Visual C++ Redistributable x64
  ; ----------------------------------------------------
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x64.exe" 0 skip_vc64
    DetailPrint "[Found Dependency] -> Processing: Visual C++ Runtime (x64)..."
    Sleep 500
    DetailPrint "Installing x64 system architectures..."
    ; /q /norestart ensures a clean, silent backdrop installation
    ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x64.exe" /q /norestart'
    DetailPrint "Visual C++ x64 components configured."
    Goto next_dep_2
  skip_vc64:
    DetailPrint "[Skipping] -> VC_redist.x64.exe not present."
  next_dep_2:
    Sleep 500

  ; ----------------------------------------------------
  ; DEPENDENCY 3: Visual C++ Redistributable x86
  ; ----------------------------------------------------
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" 0 skip_vc82
    DetailPrint "[Found Dependency] -> Processing: Visual C++ Runtime (x86)..."
    Sleep 500
    DetailPrint "Installing x86 system architectures..."
    ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" /q /norestart'
    DetailPrint "Visual C++ x86 components configured."
    Goto setup_complete
  skip_vc82:
    DetailPrint "[Skipping] -> VC_redist.x86.exe not present (ensure your x86 filename matches this exactly)."

setup_complete:
  DetailPrint "========================================="
  DetailPrint "  System Architecture Setup Complete!   "
  DetailPrint "========================================="
  Sleep 1000
!macroend