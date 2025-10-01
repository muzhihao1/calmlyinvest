// 创建demo用户的简单脚本

async function createDemoUser() {
  try {
    const response = await fetch('https://calmlyinvest.vercel.app/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'demo123'
      })
    });
    
    const data = await response.json();
    console.log('响应:', data);
    
    if (response.ok) {
      console.log('✅ Demo用户创建成功！');
      console.log('📧 邮箱: demo@example.com');
      console.log('🔑 密码: demo123');
    } else {
      console.log('❌ 创建失败:', data.error);
    }
  } catch (error) {
    console.error('错误:', error);
  }
}

createDemoUser();