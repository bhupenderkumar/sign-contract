@echo off
echo ========================================
echo   Testing Blockhash Fix
echo ========================================
echo.

echo 🔧 Starting backend server...
start "Backend Server" cmd /c "cd backend && npm start"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 🌐 Starting frontend server...
start "Frontend Server" cmd /c "npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 10 /nobreak > nul

echo 🧪 Testing fresh blockhash endpoint...
curl -s http://localhost:3001/api/contracts/fresh-blockhash

echo.
echo.
echo ✅ Servers started successfully!
echo.
echo 📋 Test Steps:
echo 1. Visit: http://localhost:5173
echo 2. Connect your Solana wallet
echo 3. Create a test contract using "Auto-fill Dev Data"
echo 4. Check browser console for blockhash logs
echo 5. Verify transaction succeeds without blockhash errors
echo.
echo 🔍 Look for these logs in browser console:
echo   - "✅ Fresh blockhash obtained: [blockhash]"
echo   - "🔏 Signing transaction with fresh blockhash: [blockhash]"
echo   - No "Transaction does not have a valid blockhash" errors
echo.
echo 🚨 If you still see blockhash errors:
echo   - Check that both servers are running
echo   - Verify your wallet has sufficient SOL (at least 0.02 SOL)
echo   - Try refreshing the page and reconnecting wallet
echo.
pause
