Set-Location "d:\priyanga\codethrive\FLEET-MANGEMENT"

$logFile = "d:\priyanga\codethrive\FLEET-MANGEMENT\git_log.txt"
"" | Out-File $logFile

"=== GIT STATUS ===" | Tee-Object -FilePath $logFile -Append
git status 2>&1 | Tee-Object -FilePath $logFile -Append

"=== SETTING REMOTE ===" | Tee-Object -FilePath $logFile -Append
git remote set-url origin https://github.com/Codethriveinfotech/FLEET-MANGEMENT.git 2>&1 | Tee-Object -FilePath $logFile -Append
git remote -v 2>&1 | Tee-Object -FilePath $logFile -Append

"=== GIT ADD ===" | Tee-Object -FilePath $logFile -Append
git add . 2>&1 | Tee-Object -FilePath $logFile -Append

"=== GIT COMMIT ===" | Tee-Object -FilePath $logFile -Append
git commit -m "Update fleet management project - Oct 2026" 2>&1 | Tee-Object -FilePath $logFile -Append

"=== GIT PUSH ===" | Tee-Object -FilePath $logFile -Append
git push origin main 2>&1 | Tee-Object -FilePath $logFile -Append

"=== DONE ===" | Tee-Object -FilePath $logFile -Append
