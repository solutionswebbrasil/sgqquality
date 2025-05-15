import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, UserPlus, Trash2, Shield, Save, X, UserCog } from 'lucide-react';
import AdminPasswordModal from '../components/AdminPasswordModal';

type User = {
  id: string;
  email: string;
  username?: string;
  created_at: string;
};

type Usuario = {
  id: string;
  username: string;
  nome_completo: string;
  cargo: string;
  ativo: boolean;
  is_admin: boolean;
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNomeCompleto, setNewNomeCompleto] = useState('');
  const [newCargo, setNewCargo] = useState('');
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

      // Check in usuarios table
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('is_admin', true)
        .single();
        
      if (usuarioData) {
        setIsAdmin(true);
        setLoading(false);
        fetchUsuarios();
        initializeMenuPermissions();
        return;
      }

      // Fall back to checking in user_roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      const hasAdminRole = userRoles?.some(ur => ur.roles?.name === 'admin');
      setIsAdmin(hasAdminRole || false);
      setLoading(false);

      if (hasAdminRole) {
        fetchUsuarios();
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

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('username');
      
      if (error) throw error;
      
      setUsuarios(data || []);
    } catch (error: any) {
      console.error('Error fetching usuarios:', error);
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
    
    if (!newUsername.trim()) {
      setError('Nome de usuário é obrigatório');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setCurrentAction('add');
    setShowPasswordModal(true);
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
        // Insert into usuarios table
        const { data, error } = await supabase
          .from('usuarios')
          .insert([{
            username: newUsername,
            password_hash: await supabase.rpc('hash_password', { password: newPassword }),
            nome_completo: newNomeCompleto,
            cargo: newCargo,
            ativo: true,
            is_admin: false
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        // Create initial empty permissions in user_permissions
        const { error: permError } = await supabase
          .from('user_permissions')
          .insert([{ 
            user_id: data.id,
            permission_id: 'menu_/'  // Default permission to see dashboard
          }]);
          
        if (permError) throw permError;
        
        fetchUsuarios();
        setNewUsername('');
        setNewPassword('');
        setNewNomeCompleto('');
        setNewCargo('');
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
          
        // Delete from usuarios table
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', selectedUserId);
        
        if (error) throw error;
        
        fetchUsuarios();
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Nome de usuário"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={newNomeCompleto}
                onChange={(e) => setNewNomeCompleto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={newCargo}
                onChange={(e) => setNewCargo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Cargo ou função"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-4 py-2 bg-[#3f4c6b] hover:bg-[#2c3e50] text-white rounded-md"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Usuário
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Nome Completo</th>
                <th className="px-6 py-3">Cargo</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Criado em</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {usuario.username}
                  </td>
                  <td className="px-6 py-4">{usuario.nome_completo || '-'}</td>
                  <td className="px-6 py-4">{usuario.cargo || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      usuario.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    {usuario.is_admin && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleManagePermissions(usuario.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Gerenciar Permissões"
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Edit user */}}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar Usuário"
                      >
                        <UserCog className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(usuario.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir Usuário"
                        disabled={usuario.is_admin}
                      >
                        <Trash2 className={`w-5 h-5 ${usuario.is_admin ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr className="bg-white border-b">
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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