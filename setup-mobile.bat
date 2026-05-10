@echo off
:: This script MUST be run as Administrator
:: Right-click this file -> "Run as administrator"

echo ============================================
echo  NewGen Royale - Mobile Testing Setup
echo  Setting up port forwarding from Windows to WSL
echo ============================================
echo.

:: Get WSL IP automatically
for /f "tokens=*" %%i in ('wsl hostname -I') do set WSL_IP=%%i
echo Detected WSL IP: %WSL_IP%
echo.

:: Clean old rules
echo Cleaning old port proxy rules...
netsh interface portproxy delete v4tov4 listenport=5173 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 >nul 2>&1

:: Add new rules pointing to current WSL IP
echo Adding port forwarding rules...
netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=%WSL_IP%
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=%WSL_IP%

:: Add firewall rules
echo Adding firewall rules...
netsh advfirewall firewall delete rule name="NewGenRoyale Vite" >nul 2>&1
netsh advfirewall firewall delete rule name="NewGenRoyale Server" >nul 2>&1
netsh advfirewall firewall add rule name="NewGenRoyale Vite" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="NewGenRoyale Server" dir=in action=allow protocol=TCP localport=3001

echo.
echo ============================================
echo  DONE! Port forwarding is active.
echo.
echo  Your Windows WiFi IP:
ipconfig | findstr /i "IPv4" | findstr "192.168"
echo.
echo  On your phone, open:
echo  http://[YOUR-IP-ABOVE]:5173
echo ============================================
pause
