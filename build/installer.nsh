!macro customInstall
  SetDetailsView show
  DetailPrint "========================================="
  DetailPrint "    Initializing 24Flight Dependency Setup"
  DetailPrint "========================================="
  Sleep 1000

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
    ExecWait '"$INSTDIR\resources\install-deps\win\jdk-26_windows-x64_bin.exe" /s'
    DetailPrint "Java Environment successfully configured."
    Goto check_arch
  skip_jdk:
    DetailPrint "[Skipping] -> jdk-26_windows-x64_bin.exe not present."

check_arch:
  ; ----------------------------------------------------
  ; ARCHITECTURE DETERMINATION LOGIC
  ; ----------------------------------------------------
  ; Check if running on 64-bit Windows
  ${If} ${RunningX64}
    DetailPrint "64-bit Architecture detected. Queuing dual VC Redist x86/x64 execution..."
    Goto install_vc86_first
  ${Else}
    DetailPrint "32-bit Architecture detected. Queuing single VC Redist x86 execution..."
    Goto install_vc86_only
  ${EndIf}

install_vc86_first:
  ; Install x86 first, then clear into x64 install block
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" 0 +2
    ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" /q /norestart'
  
  ; Fall through to install x64
install_vc64:
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x64.exe" 0 setup_complete
    DetailPrint "[Processing x64 Architecture] -> Visual C++ Runtime (x64)..."
    ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x64.exe" /q /norestart'
    Goto setup_complete

install_vc86_only:
  IfFileExists "$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" 0 setup_complete
    DetailPrint "[Processing x86 Architecture] -> Visual C++ Runtime (x86)..."
    ExecWait '"$INSTDIR\resources\install-deps\win\VC_redist.x86.exe" /q /norestart'
    Goto setup_complete

setup_complete:
  DetailPrint "========================================="
  DetailPrint "   System Architecture Setup Complete!   "
  DetailPrint "========================================="
  Sleep 1000
!macroend