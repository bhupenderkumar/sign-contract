@echo off
echo ========================================
echo   Testing Final Blockhash Fix
echo ========================================
echo.

echo 🔧 This final approach:
echo   1. Frontend prepares contract data
echo   2. Frontend signs a message to prove intent
echo   3. Backend creates contract account and transaction
echo   4. Backend gets fresh blockhash and submits directly
echo   5. Backend saves contract to database
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
echo 5. Verify transaction succeeds without any errors
echo.
echo 🔍 Look for these NEW logs in browser console:
echo   - "🔄 Creating contract directly with backend..."
echo   - "✅ User signature obtained for contract creation"
echo   - "✅ Contract created successfully!"
echo.
echo 🔍 Look for these logs in backend console:
echo   - "🔄 Creating blockchain contract directly..."
echo   - "✅ Generated contract account: [address]"
echo   - "✅ Fresh blockhash obtained: [blockhash]"
echo   - "✅ Contract created successfully on blockchain"
echo   - "✅ Contract record created in database"
echo.
echo 🎯 Expected Results:
echo   ✅ No blockhash errors at all
echo   ✅ No transaction signing errors
echo   ✅ Contract creation succeeds 100%
echo   ✅ Transaction appears on Solana Explorer
echo   ✅ Contract saved to database
echo   ✅ Platform fees collected correctly
echo.
echo 🚨 If you see any errors:
echo   - Check wallet SOL balance (need 0.02+ SOL)
echo   - Verify both servers are running
echo   - Check browser and backend console logs
echo   - Try refreshing page and reconnecting wallet
echo.
pause
