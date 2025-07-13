import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // 如果加载完成且没有用户，且不是访客模式，则跳转到登录页
    if (!loading && !user && !localStorage.getItem('guestMode')) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);
  
  // 加载中显示加载界面
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }
  
  // 如果有用户或者是访客模式，显示内容
  if (user || localStorage.getItem('guestMode')) {
    return <>{children}</>;
  }
  
  // 否则返回null（会被重定向）
  return null;
}