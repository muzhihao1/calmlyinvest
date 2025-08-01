#!/usr/bin/env node

const { exec } = require('child_process');
const https = require('https');

class VercelMonitor {
  constructor(projectUrl) {
    this.projectUrl = projectUrl;
    this.endpoints = [
      '/api/health',
      '/api/portfolios', 
      '/api/stock-quote-simple?symbol=AAPL',
      '/api/portfolio-stocks-add'
    ];
    this.checkInterval = 30000; // 30秒
  }

  // 检查端点状态
  checkEndpoint(endpoint) {
    return new Promise((resolve) => {
      const url = `${this.projectUrl}${endpoint}`;
      
      https.get(url, (res) => {
        resolve({
          endpoint,
          status: res.statusCode,
          ok: res.statusCode === 200
        });
      }).on('error', (err) => {
        resolve({
          endpoint,
          status: 0,
          ok: false,
          error: err.message
        });
      });
    });
  }

  // 监控所有端点
  async monitorEndpoints() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 检查端点状态...`);
    
    const results = await Promise.all(
      this.endpoints.map(ep => this.checkEndpoint(ep))
    );
    
    let hasErrors = false;
    
    results.forEach(result => {
      const icon = result.ok ? '✅' : '❌';
      console.log(`${icon} ${result.endpoint}: ${result.status}`);
      
      if (!result.ok) {
        hasErrors = true;
        
        // 如果失败，尝试获取更多信息
        if (result.status === 500) {
          this.getErrorDetails(result.endpoint);
        }
      }
    });
    
    if (hasErrors) {
      this.triggerDebug();
    }
  }

  // 获取错误详情
  getErrorDetails(endpoint) {
    exec(`curl -s "${this.projectUrl}${endpoint}"`, (err, stdout) => {
      if (!err && stdout) {
        console.log(`  错误详情: ${stdout.substring(0, 200)}...`);
      }
    });
  }

  // 触发调试流程
  triggerDebug() {
    console.log('\n🔧 检测到错误，运行调试...');
    
    // 获取Vercel日志
    exec('vercel logs --limit 20', (err, stdout) => {
      if (!err) {
        console.log('\n最近的Vercel日志:');
        console.log(stdout);
      }
    });
  }

  // 开始监控
  start() {
    console.log(`🚀 开始监控 ${this.projectUrl}`);
    console.log(`检查间隔: ${this.checkInterval/1000}秒`);
    console.log('按 Ctrl+C 停止监控\n');
    
    // 立即执行一次
    this.monitorEndpoints();
    
    // 定期执行
    setInterval(() => {
      this.monitorEndpoints();
    }, this.checkInterval);
  }
}

// 使用示例
const monitor = new VercelMonitor('https://calmlyinvest.vercel.app');
monitor.start();