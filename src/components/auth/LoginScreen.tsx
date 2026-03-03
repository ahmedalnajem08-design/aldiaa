'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/stores/app-store';

interface UserItem {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  branch?: { name: string };
}

// Generate particles for background animation
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 20}s`,
      animationDuration: `${15 + Math.random() * 10}s`,
    },
  }));
};

export function LoginScreen() {
  const { login } = useAppStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [particles] = useState(() => generateParticles(30));

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (showPasswordDialog && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [showPasswordDialog]);

  const handleUserClick = (user: UserItem) => {
    setSelectedUser(user);
    setPassword('');
    setError('');
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, password })
      });
      
      const data = await res.json();
      
      if (data.success && data.user) {
        login(data.user);
      } else {
        setError(data.message || 'كلمة المرور غير صحيحة');
        setIsLoading(false);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowPasswordDialog(false);
    setSelectedUser(null);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen animated-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Particles Background */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={particle.style}
          />
        ))}
      </div>

      {/* Logo and Title */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center relative z-10"
      >
        <div className="relative flex flex-col items-center">
          {/* الشعار المتحرك */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              filter: [
                'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
                'drop-shadow(0 0 40px rgba(255, 215, 0, 0.8))',
                'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))'
              ]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-4"
          >
            <img 
              src="/logo.png" 
              alt="الضيــــــــــاء" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain"
            />
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl font-digital text-amber-400 glow mb-2"
            animate={{ 
              textShadow: [
                '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6)',
                '0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.8)',
                '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            الضيــــــــــاء
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/80 text-lg md:text-xl"
          >
            نظام إدارة محطات الوقود
          </motion.p>
        </div>
      </motion.div>

      {/* Users Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl w-full relative z-10"
      >
        {users.length === 0 ? (
          // Default users if none exist
          <>
            {['مدير النظام', 'محمد', 'أحمد', 'خالد'].map((name, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <UserCard
                  user={{
                    id: name,
                    name,
                    role: index === 0 ? 'admin' : 'user'
                  }}
                  onClick={() => handleUserClick({
                    id: name,
                    name,
                    role: index === 0 ? 'admin' : 'user'
                  })}
                />
              </motion.div>
            ))}
          </>
        ) : (
          users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <UserCard user={user} onClick={() => handleUserClick(user)} />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              تسجيل الدخول
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            {/* User Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            
            {/* User Name */}
            <p className="text-lg font-semibold mb-4">{selectedUser?.name}</p>
            
            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="w-full space-y-4">
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 text-right text-lg h-12"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-center text-sm"
                >
                  {error}
                </motion.p>
              )}
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !password}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {isLoading ? 'جاري التحقق...' : 'دخول'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 text-center"
      >
        <p className="text-white/70 text-sm font-medium mb-1">
          صُمم خصيصاً لمحطات الضيــــــــــاء
        </p>
        <p className="text-white/50 text-xs mb-2">
          بواسطة المطور أحمد ال نجم
        </p>
        <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
          <a 
            href="https://wa.me/9647762788088" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-green-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            واتساب: +9647762788088
          </a>
          <span className="text-white/20">|</span>
          <a 
            href="https://instagram.com/9.cas" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-pink-400 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            انستا: 9.cas
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// User Card Component
function UserCard({ user, onClick }: { user: UserItem; onClick: () => void }) {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
  ];

  const colorIndex = Math.abs(user.name.charCodeAt(0) % colors.length);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center gap-3 hover:bg-white/20 transition-all cursor-pointer border border-white/20"
    >
      {/* Avatar */}
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center shadow-lg`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-white">
            {user.name.charAt(0)}
          </span>
        )}
      </div>
      
      {/* Name */}
      <span className="text-white font-medium text-center">{user.name}</span>
      
      {/* Role Badge */}
      <span className={`px-2 py-0.5 rounded-full text-xs ${
        user.role === 'admin' 
          ? 'bg-amber-500/20 text-amber-300' 
          : 'bg-blue-500/20 text-blue-300'
      }`}>
        {user.role === 'admin' ? 'مدير' : user.role === 'manager' ? 'مشرف' : 'موظف'}
      </span>
    </motion.button>
  );
}
