@echo off
setlocal
echo Building PWADC Security Operations Suite v3.1.34...
dotnet publish SecurityOperationsSuite.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true
pause
