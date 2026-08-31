@echo off
chcp 65001 >nul
echo ================================================
echo   午餐叫飯小幫手 - 自動部署工具
echo ================================================
echo.
echo 正在部署到 Cloudflare...
npx wrangler deploy
echo.
echo 部署完成！
pause
