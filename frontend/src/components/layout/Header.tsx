import React from 'react' 
import { Link, NavLink, useNavigate } from 'react-router-dom' // Added NavLink
import { useTranslation } from 'react-i18next'
import {
  HomeIcon,
  ChartBarIcon,
  DocumentIcon as DocumentOutlineIcon, 
  AcademicCapIcon,
  DocumentTextIcon, 
  QuestionMarkCircleIcon, 
  UserIcon,
  // ArrowRightOnRectangleIcon, // Replaced by lucide LogOut
  SparklesIcon, 
  Bars3Icon, 
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { Dialog, Popover, Transition } from '@headlessui/react' 
import { Fragment, useState } from 'react' 
import { useAuthStore, usePermission } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown' 
import { LanguageSwitch } from '@/components/common/LanguageSwitch' 
import { NotificationCenter } from '@/components/common/NotificationCenter' 
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import { APP_CONFIG } from '@/utils/constants' 
import { ChevronDown, LogOut, Settings, LayoutDashboard, FileText, BookOpen, Edit3, Users, Bell, Languages, UserCircle } from 'lucide-react'; // More lucide icons

export const Header: React.FC = () => {
  const { t } = useTranslation();
  // const location = useLocation(); // location might not be needed if NavLink handles active state
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { checkPermission } = usePermission(); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 

  const navigation = [
    { name: t('nav.home'), href: '/', icon: HomeIcon, public: true }, 
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard, requireAuth: true, permission: 'progress.view' }, // Lucide icon
    { name: t('nav.files'), href: '/files', icon: FileText, requireAuth: true },  // Lucide icon
    { name: t('nav.learningPaths'), href: '/learning-paths', icon: BookOpen, requireAuth: true, permission: 'learning.view' }, // Lucide icon
    { name: t('nav.exams'), href: '/exams', icon: Edit3, requireAuth: true, permission: 'exam.take' }, // Lucide icon
    { 
      name: t('nav.questions'), 
      href: '/questions', 
      icon: QuestionMarkCircleIcon, // Keeping Heroicon for consistency or change all
      requireAuth: true,
      requiredRoles: ['TEACHER', 'ADMIN'] 
    },
    { name: t('nav.adminUsers', '用户管理'), href: '/admin/users', icon: Users, requireAuth: true, requiredRoles: ['ADMIN'] }, // Lucide icon
  ];

  const handleLogout = async () => {
    try {
      await logout(); 
      toast.success(t('auth.logoutSuccess'));
      navigate('/');
      setMobileMenuOpen(false);
    } catch (error) {
      toast.error(t('errors.operationFailed', '退出失败'));
    }
  };

  const filteredNavItems = navigation.filter(item => {
    if (item.public) return true;
    if (!isAuthenticated) return false;
    if (item.requiredRoles && (!user || !item.requiredRoles.includes(user.role))) return false;
    return item.permission ? checkPermission(item.permission) : true; 
  });

  const userMenuItems = [
    {
      label: t('nav.profile'),
      icon: UserCircle, // Lucide icon
      onClick: () => { navigate('/profile'); setMobileMenuOpen(false); },
    },
    // Example for settings, if you add a settings page
    // {
    //   label: t('nav.settings', '设置'), 
    //   icon: Settings,
    //   onClick: () => { navigate('/settings'); setMobileMenuOpen(false); },
    // },
    {
      label: t('nav.logout'),
      icon: LogOut, 
      onClick: handleLogout,
      className: 'text-red-600 hover:bg-red-50 focus:bg-red-50', // Added focus style
    },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50"> 
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global"> 
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-x-2">
            <SparklesIcon className="h-8 w-8 text-primary-600" aria-hidden="true" />
            <span className="text-xl font-semibold text-gray-900">{APP_CONFIG.APP_NAME}</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">打开主菜单</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <Popover.Group className="hidden lg:flex lg:gap-x-2"> {/* Reduced gap for more items */}
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center gap-x-1 px-3 py-2 text-sm font-semibold leading-6 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors", 
                isActive && "text-primary-600 bg-primary-50"
              )}
            >
              <item.icon className="h-4 w-4" /> 
              {item.name}
            </NavLink>
          ))}
        </Popover.Group>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-3"> 
          <LanguageSwitch />
          {isAuthenticated ? (
            <>
              <NotificationCenter />
              <Dropdown
                trigger={
                  <div className="flex items-center gap-x-1.5 cursor-pointer p-2 hover:bg-gray-100 rounded-md transition-colors">
                    <img 
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random&color=fff&size=32`} 
                      alt="User Avatar" 
                      className="h-7 w-7 rounded-full object-cover" // Slightly smaller avatar
                    />
                    <span className="text-sm font-medium text-gray-700 hidden xl:inline">{user?.name}</span> {/* Hide on md, show on xl */}
                    <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </div>
                }
                items={userMenuItems}
                align="right"
              />
            </>
          ) : (
            <div className="flex items-center gap-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                {t('auth.login')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                {t('auth.register')}
              </Button>
            </div>
          )}
        </div>
      </nav>

      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-50" /> 
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-x-2" onClick={() => setMobileMenuOpen(false)}>
              <SparklesIcon className="h-8 w-8 text-primary-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900">{APP_CONFIG.APP_NAME}</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">关闭菜单</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                     <div className="flex items-center gap-x-3 -mx-3 px-3 py-2 border-b mb-2">
                       <img 
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random&color=fff&size=32`} 
                        alt="User Avatar" 
                        className="h-8 w-8 rounded-full object-cover" 
                      />
                      <span className="text-base font-semibold leading-7 text-gray-900">{user.name}</span>
                    </div>
                    {userMenuItems.map(item => (
                       <button
                        key={item.label}
                        onClick={item.onClick} // onClick already closes menu via setMobileMenuOpen(false) in userMenuItems
                        className={cn(
                          "flex items-center gap-x-3 -mx-3 w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                          item.className
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('auth.login')}
                    </Link>
                    <Link
                      to="/register"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('auth.register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
}
