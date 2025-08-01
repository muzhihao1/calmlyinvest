# CalmlyInvest Project Overview

## Project Purpose
CalmlyInvest (持仓助手/智能仓位管家) is a Stock Portfolio Risk Management Application designed for Chinese stock market investors. It helps users monitor and manage portfolio risk through:
- Real-time leverage calculations
- Position analysis
- Smart risk recommendations
- Portfolio visualization

## Target Users
- Chinese stock market investors
- Portfolio managers
- Risk-conscious traders

## Key Features
- **Portfolio Management**: Track stocks and options holdings
- **Risk Analysis**: Calculate leverage ratio, portfolio beta, concentration risk
- **Real-time Market Data**: Integration with Yahoo Finance API
- **Multi-mode Access**: Guest mode (memory storage) and authenticated mode (database persistence)
- **Data Import/Export**: CSV import functionality for batch operations
- **Bilingual Support**: UI in both English and Chinese

## Current Issues
1. Database connection failures (ECONNRESET errors with Supabase)
2. Authentication system failures (cannot login, demo account not working)
3. Data persistence failures (cannot save to database)
4. Poor error handling and user experience

## Live Demo
- URL: https://calmlyinvest.vercel.app
- Demo Account: demo/demo123 (currently not working)
- Guest Mode: Available without login