@echo off
setlocal
set "LOCAL_MVN=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6\apache-maven-3.9.6\bin\mvn.cmd"
if exist "%LOCAL_MVN%" (
    call "%LOCAL_MVN%" %*
    exit /b %ERRORLEVEL%
)
set "LOCAL_MVN2=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6\0f95e7798d182e3371f3fee6d8202d3a56e6d71dfd3a2402139882ef2fbe7476\bin\mvn.cmd"
if exist "%LOCAL_MVN2%" (
    call "%LOCAL_MVN2%" %*
    exit /b %ERRORLEVEL%
)
echo [ERROR] Maven distribution not found in %USERPROFILE%\.m2\wrapper\dists
exit /b 1
