#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤖 Vercel自动化部署调试器');
console.log('=========================\n');

class VercelDebugger {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  // 执行命令并返回输出
  exec(command, silent = false) {
    try {
      const output = execSync(command, { encoding: 'utf-8' });
      if (!silent) console.log(output);
      return output;
    } catch (error) {
      this.errors.push({ command, error: error.message });
      return null;
    }
  }

  // 1. 检查Vercel CLI安装
  checkVercelCLI() {
    console.log('📌 检查Vercel CLI...');
    const result = this.exec('vercel --version', true);
    if (!result) {
      this.fixes.push('npm install -g vercel');
      return false;
    }
    console.log(`✅ Vercel CLI已安装: ${result.trim()}`);
    return true;
  }

  // 2. 检查项目配置
  checkProjectConfig() {
    console.log('\n📌 检查项目配置...');
    
    // 检查vercel.json
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
      const config = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
      console.log('✅ vercel.json存在');
      
      // 检查functions配置
      if (!config.functions) {
        this.warnings.push('vercel.json缺少functions配置');
        this.fixes.push('在vercel.json中添加: "functions": { "api/**/*.ts": { "maxDuration": 10 } }');
      }
      
      // 检查outputDirectory
      if (config.outputDirectory && !fs.existsSync(config.outputDirectory)) {
        this.errors.push(`输出目录不存在: ${config.outputDirectory}`);
      }
    } else {
      this.warnings.push('未找到vercel.json文件');
    }
  }

  // 3. 检查API函数
  checkAPIFunctions() {
    console.log('\n📌 检查API函数...');
    
    const apiDirs = ['api', 'calmlyinvest/api'];
    
    apiDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`\n检查 ${dir} 目录:`);
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // 检查export default
          if (!content.includes('export default')) {
            this.errors.push(`${filePath}: 缺少 export default`);
            this.fixes.push(`在 ${filePath} 中添加: export default handler`);
          }
          
          // 检查CORS配置
          if (!content.includes('Access-Control-Allow-Origin')) {
            this.warnings.push(`${filePath}: 缺少CORS配置`);
          }
          
          // 检查TypeScript类型
          if (file.endsWith('.ts') && !content.includes('VercelRequest')) {
            this.warnings.push(`${filePath}: 建议使用 VercelRequest 和 VercelResponse 类型`);
          }
          
          console.log(`  ✓ ${file}`);
        });
      }
    });
  }

  // 4. 获取部署日志
  async getDeploymentLogs() {
    console.log('\n📌 获取部署日志...');
    
    // 获取最新部署
    const deployments = this.exec('vercel list --json --count 1', true);
    if (deployments) {
      try {
        const deployment = JSON.parse(deployments)[0];
        if (deployment) {
          console.log(`最新部署: ${deployment.url}`);
          console.log(`状态: ${deployment.state}`);
          console.log(`创建时间: ${new Date(deployment.created).toLocaleString()}`);
          
          // 如果部署失败，获取错误日志
          if (deployment.state === 'ERROR' || deployment.state === 'FAILED') {
            console.log('\n❌ 部署失败，获取错误日志...');
            this.exec(`vercel logs ${deployment.url} --limit 100`);
          }
        }
      } catch (e) {
        this.errors.push('无法解析部署信息');
      }
    }
  }

  // 5. 测试API端点
  async testAPIEndpoints() {
    console.log('\n📌 测试API端点...');
    
    const endpoints = [
      '/api/health',
      '/api/portfolios',
      '/api/stock-quote-simple?symbol=AAPL',
      '/api/portfolio-stocks-add',
      '/api/user-portfolios-simple?userId=guest-user',
      '/api/portfolio-details-simple?portfolioId=demo-portfolio-1'
    ];
    
    // 获取部署URL
    const deployments = this.exec('vercel list --json --count 1', true);
    if (deployments) {
      try {
        const deployment = JSON.parse(deployments)[0];
        if (deployment && deployment.url) {
          const baseUrl = `https://${deployment.url}`;
          
          for (const endpoint of endpoints) {
            const url = `${baseUrl}${endpoint}`;
            console.log(`\n测试: ${endpoint}`);
            
            try {
              const response = this.exec(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, true);
              const statusCode = parseInt(response);
              
              if (statusCode === 200) {
                console.log(`  ✅ 200 OK`);
              } else if (statusCode === 404) {
                console.log(`  ❌ 404 Not Found`);
                this.errors.push(`端点不存在: ${endpoint}`);
              } else if (statusCode === 500) {
                console.log(`  ❌ 500 Internal Server Error`);
                this.errors.push(`端点错误: ${endpoint}`);
                
                // 获取错误详情
                const errorResponse = this.exec(`curl -s "${url}"`, true);
                if (errorResponse) {
                  console.log(`  错误详情: ${errorResponse.substring(0, 200)}...`);
                }
              } else {
                console.log(`  ⚠️ ${statusCode}`);
              }
            } catch (e) {
              console.log(`  ❌ 请求失败`);
            }
          }
        }
      } catch (e) {
        console.log('无法获取部署URL');
      }
    }
  }

  // 6. 生成修复建议
  generateReport() {
    console.log('\n\n📊 调试报告');
    console.log('===========');
    
    if (this.errors.length > 0) {
      console.log('\n❌ 错误 (' + this.errors.length + '):');
      this.errors.forEach((e, i) => {
        console.log(`  ${i + 1}. ${typeof e === 'string' ? e : e.error || JSON.stringify(e)}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告 (' + this.warnings.length + '):');
      this.warnings.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w}`);
      });
    }
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 建议修复 (' + this.fixes.length + '):');
      this.fixes.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f}`);
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ 未发现明显问题！');
    }
  }

  // 运行所有检查
  async run() {
    // 检查基础环境
    if (!this.checkVercelCLI()) {
      console.log('\n❌ 请先安装Vercel CLI');
      return;
    }

    // 运行所有检查
    this.checkProjectConfig();
    this.checkAPIFunctions();
    await this.getDeploymentLogs();
    await this.testAPIEndpoints();
    
    // 生成报告
    this.generateReport();
  }
}

// 运行调试器
const vercelDebugger = new VercelDebugger();
vercelDebugger.run().catch(console.error);