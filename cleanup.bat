@echo off

:: List of files to be removed
set files=testpdf-manifest.json testpdf-manifest.csv testpdf-id.txt manifest.json metadata-id.json metadata.json

:: Remove each file and print status
for %%f in (%files%) do (
    if exist "%%f" (
        del "%%f"
        echo Removed: %%f
    ) else (
        echo Not found: %%f
    )
)

:: Remove testpdf directory if it exists
if exist "testpdf" (
    rmdir /s /q "testpdf"
    echo Removed: testpdf directory
) else (
    echo Not found: testpdf directory
)

pause 