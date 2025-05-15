import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, UserPlus, Trash2, Shield, Save, X } from 'lucide-react';
import AdminPasswordModal from '../components/AdminPasswordModal';

type User = {
  id: string;
  email: string;
  username?: string;
  created_at: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
};

type MenuPermission = {
  id: string;
  path: string;
  label: string;
  category: string;
  selected: boolean;
};

function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<'add' | 'delete' | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([]);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      const hasAdminRole = userRoles?.some(ur => ur.roles?.name === 'admin');
      setIsAdmin(hasAdminRole || false);
      setLoading(false);

      if (hasAdminRole) {
        fetchUsers();
        initializeMenuPermissions();
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const initializeMenuPermissions = () => {
    const allMenuCategories = {
      'Cadastros': [
        { path: '/cadastro-toners', label: 'Cadastro de Toners' },
        { path: '/cadastro-unidades', label: 'Cadastro de Unidades' },
        { path: '/cadastro-formularios-auditoria', label: 'Cadastro de Formulários de Auditoria' },
      ],
      'Registros - Qualidade': [
        { path: '/registro-garantias', label: 'Registro de Garantias' },
        { path: '/tco', label: 'Registro de TCO' },
        { path: '/registro-retornados', label: 'Registro de Retornados' },
        { path: '/registro-nc', label: 'Registro de NC' },
      ],
      'Registros - Auditoria': [
        { path: '/registro-auditoria', label: 'Registro de Auditoria' },
      ],
      'Consultas': [
        { path: '/consulta-garantias', label: 'Consulta de Garantias' },
        { path: '/consulta-retornados', label: 'Consulta de Retornados' },
        { path: '/consulta-toners', label: 'Consulta de Toners' },
        { path: '/consulta-unidades', label: 'Consulta de Unidades' },
        { path: '/consulta-tco', label: 'Consulta de TCO' },
        { path: '/consulta-nc', label: 'Consulta de NC' },
        { path: '/consulta-auditorias', label: 'Consulta de Auditorias' },
      ],
      'Gráficos': [
        { path: '/graficos', label: 'Análise de Dados' },
      ]
    };
    
    const permissions: MenuPermission[] = [];
    
    Object.entries(allMenuCategories).forEach(([category, items]) => {
      items.forEach((item) => {
        permissions.push({
          id: `menu_${item.path.replace(/\//g, '_')}`,
          path: item.path,
          label: item.label,
          category,
          selected: false
        });
      });
    });
    
    setMenuPermissions(permissions);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      
      // Filter out admin users
      const filteredUsers = data.users.filter(user => {
        const metadata = user.user_metadata as any;
        return metadata?.username !== 'admin';
      });
      
      setUsers(filteredUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(`Erro ao buscar usuários: ${error.message}`);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission_id')
        .eq('user_id', userId);

      if (error) throw error;

      const userPermissions = data?.map(p => p.permission_id) || [];
      
      // Update the menu permissions with the user's permissions
      const updatedPermissions = menuPermissions.map(permission => ({
        ...permission,
        selected: userPermissions.includes(permission.id)
      }));
      
      setMenuPermissions(updatedPermissions);
      setSelectedUserPermissions(userPermissions);
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
      setError(`Erro ao buscar permissões: ${error.message}`);
    }
  };

  const handleCreateUser = () => {
    if (!isAdmin) return;
    
    if (!validateUsername(newUsername)) {
      setError('Username deve estar no formato nome.sobrenome');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setCurrentAction('add');
    setShowPasswordModal(true);
  };

  const validateUsername = (username: string): boolean => {
    // Check if username follows firstname.lastname format
    const pattern = /^[a-zA-Z]+\.[a-zA-Z]+$/;
    return pattern.test(username);
  };

  const handleDeleteUser = (userId: string) => {
    if (!isAdmin) return;
    setSelectedUserId(userId);
    setCurrentAction('delete');
    setShowPasswordModal(true);
  };

  const handleManagePermissions = (userId: string) => {
    if (!isAdmin) return;
    setSelectedUserId(userId);
    fetchUserPermissions(userId);
    setShowPermissionsModal(true);
  };

  const handlePermissionChange = (permissionId: string, selected: boolean) => {
    setMenuPermissions(
      menuPermissions.map(permission => 
        permission.id === permissionId ? { ...permission, selected } : permission
      )
    );
    
    if (selected) {
      setSelectedUserPermissions([...selectedUserPermissions, permissionId]);
    } else {
      setSelectedUserPermissions(selectedUserPermissions.filter(id => id !== permissionId));
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) return;
    
    try {
      // First delete existing permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUserId);
      
      // Then insert new permissions
      if (selectedUserPermissions.length > 0) {
        const { error } = await supabase
          .from('user_permissions')
          .insert(
            selectedUserPermissions.map(permissionId => ({
              user_id: selectedUserId,
              permission_id: permissionId
            }))
          );
        
        if (error) throw error;
      }
      
      setSuccess('Permissões atualizadas com sucesso');
      setTimeout(() => setSuccess(null), 3000);
      setShowPermissionsModal(false);
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      setError(`Erro ao salvar permissões: ${error.message}`);
    }
  };

  const handleAdminPasswordConfirm = async () => {
    if (currentAction === 'add') {
      try {
        // Format the email from the username
        const email = `${newUsername}@sgq.com`;
        
        // Create the user
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            username: newUsername
          }
        });
        
        if (error) throw error;
        
        // Create initial empty permissions in user_permissions
        const { error: permError } = await supabase
          .from('user_permissions')
          .insert([{ 
            user_id: data.user.id,
            permission_id: 'menu_/'  // Default permission to see dashboard
          }]);
          
        if (permError) throw permError;
        
        fetchUsers();
        setNewUsername('');
        setNewPassword('');
        setSuccess('Usuário criado com sucesso');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error: any) {
        console.error('Error creating user:', error);
        setError(`Erro ao criar usuário: ${error.message}`);
      }
    } else if (currentAction === 'delete' && selectedUserId) {
      try {
        // First delete user permissions
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', selectedUserId);
          
        // Delete user roles
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUserId);
        
        // Then delete the user
        const { error } = await supabase.auth.admin.deleteUser(
          selectedUserId
        );
        
        if (error) throw error;
        
        fetchUsers();
        setSuccess('Usuário excluído com sucesso');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error: any) {
        console.error('Error deleting user:', error);
        setError(`Erro ao excluir usuário: ${error.message}`);
      }
    }

    setShowPasswordModal(false);
    setCurrentAction(null);
    setSelectedUserId(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center p-8">
          <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-[#3f4c6b]" />
        <h2 className="text-2xl font-semibold text-gray-800">Configurações do Sistema</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-lg">
          {success}
        </div>
      )}

      {/* User Management Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Gerenciamento de Usuários</h3>

        {/* Add User Form */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Adicionar Novo Usuário</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário (nome.sobrenome)
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="joao.silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateUser}
                className="flex items-center gap-2 px-4 py-2 bg-[#3f4c6b] hover:bg-[#2c3e50] text-white rounded-md"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar Usuário
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Data de Criação</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                // Try to get username from metadata
                let username = '';
                if (user.user_metadata && typeof user.user_metadata === 'object') {
                  username = (user.user_metadata as any).username || '';
                }
                
                return (
                  <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {username || 'N/A'}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManagePermissions(user.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Gerenciar Permissões"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr className="bg-white border-b">
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleAdminPasswordConfirm}
        title={currentAction === 'add' ? "Confirmar Adição de Usuário" : "Confirmar Exclusão de Usuário"}
      />

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Gerenciar Permissões de Menu
              </h3>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Group permissions by category */}
              {Object.entries(
                menuPermissions.reduce((acc: {[key: string]: MenuPermission[]}, curr) => {
                  if (!acc[curr.category]) {
                    acc[curr.category] = [];
                  }
                  acc[curr.category].push(curr);
                  return acc;
                }, {})
              ).map(([category, permissions]) => (
                <div key={category} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {category}
                  </h4>
                  <div className="space-y-3">
                    {permissions.map((permission) => (
                      <label key={permission.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permission.selected}
                          onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {permission.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                className="flex items-center gap-2 px-4 py-2 bg-[#3f4c6b] hover:bg-[#2c3e50] text-white rounded-md"
              >
                <Save className="w-4 h-4" />
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;