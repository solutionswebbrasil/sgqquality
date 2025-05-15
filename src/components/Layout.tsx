import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Database, Box, Shield, FileSpreadsheet, AlertTriangle, ClipboardCheck, FileText, BarChart, Menu, LogOut } from 'lucide-react';
import Footer from './Footer';
import { useAuthContext } from './AuthProvider';
import useDarkMode from '../hooks/useDarkMode';
import { supabase } from '../lib/supabase';

const menuCategories = {
  Cadastros: [
    { path: '/cadastro-toners', label: 'Cadastro de Toners', icon: Database },
    { path: '/cadastro-unidades', label: 'Cadastro de Unidades', icon: Box },
    { path: '/cadastro-formularios-auditoria', label: 'Cadastro de Formulários de Auditoria', icon: ClipboardCheck },
  ],
  'Registros - Qualidade': [
    { path: '/registro-garantias', label: 'Registro de Garantias', icon: Shield },
    { path: '/tco', label: 'Registro de TCO', icon: FileSpreadsheet },
    { path: '/registro-retornados', label: 'Registro de Retornados', icon: Box },
    { path: '/registro-nc', label: 'Registro de NC', icon: AlertTriangle },
  ],
  'Registros - Auditoria': [
    { path: '/registro-auditoria', label: 'Registro de Auditoria', icon: ClipboardCheck },
  ],
  Consultas: [
    { path: '/consulta-garantias', label: 'Consulta de Garantias', icon: Shield },
    { path: '/consulta-retornados', label: 'Consulta de Retornados', icon: Box },
    { path: '/consulta-toners', label: 'Consulta de Toners', icon: Database },
    { path: '/consulta-unidades', label: 'Consulta de Unidades', icon: Box },
    { path: '/consulta-tco', label: 'Consulta de TCO', icon: FileSpreadsheet },
    { path: '/consulta-nc', label: 'Consulta de NC', icon: AlertTriangle },
    { path: '/consulta-auditorias', label: 'Consulta de Auditorias', icon: ClipboardCheck },
  ],
  Gráficos: [
    { path: '/graficos', label: 'Análise de Dados', icon: BarChart },
  ]
};

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [allowedMenuPaths, setAllowedMenuPaths] = useState<string[]>([]);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If no user, allow only dashboard
        setAllowedMenuPaths(['/']);
        return;
      }

      // Check if user is admin
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(ur => ur.roles?.name === 'admin');
      
      if (isAdmin) {
        // Admin can see everything
        setAllowedMenuPaths(['all']);
        return;
      }

      // Get user permissions
      const { data: permissions } = await supabase
        .from('user_permissions')
        .select('permission_id')
        .eq('user_id', user.id);

      if (permissions && permissions.length > 0) {
        const menuPaths = permissions
          .map(p => p.permission_id)
          .filter(id => id.startsWith('menu_'))
          .map(id => id.replace('menu_', '').replace(/_/g, '/'));
        
        // Always add dashboard
        if (!menuPaths.includes('/')) {
          menuPaths.push('/');
        }
        
        setAllowedMenuPaths(menuPaths);
      } else {
        // If no specific permissions, only allow dashboard
        setAllowedMenuPaths(['/']);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      // On error, allow only dashboard
      setAllowedMenuPaths(['/']);
    }
  };

  const getCurrentPageTitle = () => {
    for (const [category, items] of Object.entries(menuCategories)) {
      const item = items.find(item => item.path === location.pathname);
      if (item) return item.label;
    }
    if (location.pathname === '/settings') return 'Configurações';
    return 'Dashboard';
  };

  const isMenuItemVisible = (path: string): boolean => {
    // If no permissions loaded yet, show nothing
    if (allowedMenuPaths.length === 0) {
      return false;
    }
    
    // Admin can see everything
    if (allowedMenuPaths.includes('all')) {
      return true;
    }
    
    // Check if this specific path is allowed
    return allowedMenuPaths.includes(path);
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-[#3f4c6b]'} text-white w-64 transition-all duration-300 ${isSidebarOpen ? '' : '-ml-64'}`}>
          <div className="p-4 text-xl font-bold border-b border-gray-700 flex justify-between items-center">
            <span>SGQ</span>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white hover:text-gray-300"
            >
              {isSidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          <nav className="mt-4">
            {Object.entries(menuCategories).map(([category, items]) => (
              <div key={category} className="mb-4">
                <div className="px-4 py-2 text-sm font-semibold text-gray-300 uppercase">
                  {category}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  // Only render menu items the user has permission to see
                  if (!isMenuItemVisible(item.path)) return null;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-4 py-2 text-sm ${
                        location.pathname === item.path
                          ? `${isDarkMode ? 'bg-gray-700' : 'bg-[#2c3e50]'} text-white`
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="px-4 py-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className={`p-2 rounded-md ${
                      isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                )}
                <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {getCurrentPageTitle()}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDarkMode}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;