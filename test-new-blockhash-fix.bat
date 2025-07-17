@echo off
echo ========================================
echo   Testing New Blockhash Fix Approach
echo ========================================
echo.

echo 🔧 This new approach:
echo   1. Frontend gets transaction template from backend
echo   2. Frontend signs a message to prove intent
echo   3. Backend creates transaction with fresh blockhash
echo   4. Backend submits transaction directly to blockchain
echo.

echo 🚀 Starting servers...
echo.

echo 🔧 Starting backend server...
start "Backend Server" cmd /c "cd backend && npm start"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 🌐 Starting frontend server...
start "Frontend Server" cmd /c "npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 10 /nobreak > nul

echo ✅ Servers started successfully!
echo.
echo 📋 Test Steps:
echo 1. Visit: http://localhost:5173
echo 2. Connect your Solana wallet (ensure 0.02+ SOL)
echo 3. Create a test contract using "Auto-fill Dev Data"
echo 4. Check browser console for new flow logs
echo 5. Verify transaction succeeds without blockhash errors
echo.
echo 🔍 Look for these NEW logs in browser console:
echo   - "🔄 Requesting backend to finalize transaction with fresh blockhash..."
echo   - "✅ User signature obtained for contract creation"
echo   - No more transaction reconstruction or signing errors
echo.
echo 🔍 Look for these logs in backend console:
echo   - "🔄 Finalizing contract creation with fresh blockhash..."
echo   - "✅ Fresh blockhash obtained: [blockhash]"
echo   - "✅ Contract created successfully on blockchain"
echo.
echo 🎯 Expected Results:
echo   ✅ No "Blockhash is invalid or can not be validated" errors
echo   ✅ Contract creation succeeds
echo   ✅ Transaction appears on Solana Explorer
echo   ✅ Platform fees collected correctly
echo.
pause
