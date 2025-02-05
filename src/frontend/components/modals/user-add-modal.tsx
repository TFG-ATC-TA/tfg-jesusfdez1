'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Farm } from '@/types';
import { useSession } from 'next-auth/react';
import { DataTable } from '@/components/ui/data-table';
import { columnsAlternative } from '@/components/tables/farm-tables/columns';

import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const UserAddModal: React.FC<{ isOpen: boolean; onClose: () => void; onRefresh: () => void }> = ({ isOpen, onClose, onRefresh }) => {
  const { data: session } = useSession();
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    surname: '',
    email: ''
  });
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [role, setRole] = useState('');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarms, setSelectedFarms] = useState<Record<string, boolean>>({});
  const [roleError, setRoleError] = useState(false);
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { toast } = useToast();

  const fetchFarms = async () => {
    if (!session?.accessToken) {
      console.error('No hay sesión iniciada');
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5001/farm/list?page=${page}&limit=10&searchTerm=${searchTerm}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Error al obtener granjas');
      }
      const result = await response.json();
      setFarms(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener granjas:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFarms();
    }
  }, [isOpen, session, page, searchTerm]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const updated = { ...passwords, [id]: value };
    setPasswords(updated);
    setPasswordsMatch(updated.new === updated.confirm);
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    setRoleError(false);
    if (value === 'Administrador') setSelectedFarms({});
  };

  const handleSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    setSelectedFarms(selectedRowIds);
  };

  const resetForm = () => {
    setPersonalInfo({
      name: '',
      surname: '',
      email: ''
    });
    setPasswords({
      new: '',
      confirm: ''
    });
    setPasswordsMatch(true);
    setRole('');
    setRoleError(false);
    setSelectedFarms({});
    setShowPassword({
      new: false,
      confirm: false
    });
    setPage(1);
    setSearchTerm('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = (e as React.FormEvent<HTMLFormElement> & { nativeEvent: SubmitEvent }).nativeEvent.submitter as HTMLButtonElement;
    if (target && target.id === 'submit-data-button') {
      if (!role) {
        setRoleError(true);
        return;
      }
      const selectedFarmIds = Object.entries(selectedFarms)
        .filter(([_, isSelected]) => isSelected)
        .map(([farmId, _]) => farmId);
      console.log('Datos actualizados:', {
        ...personalInfo,
        role,
        farms: selectedFarmIds
      });
      const updateUser = async () => {
        if (!session?.accessToken) {
          console.error('No hay sesión iniciada');
          toast({
            title: "Error",
            description: "No hay sesión iniciada",
            variant: "destructive",
          });
          return;
        }
        
        try {
          const response = await fetch(`http://localhost:5001/user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
            body: JSON.stringify({
              ...personalInfo,
              role,
              farms: selectedFarmIds,
              password: passwords.new === passwords.confirm ? passwords.new : undefined,
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Error al crear el usuario');
          }
          
          console.log('Usuario creado con éxito');
          toast({
            description: "Usuario creado con éxito",
            variant: "success",
          });
          resetForm();
          onClose();
          onRefresh();
        } catch (error) {
          console.error('Error al crear el usuario:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al crear el usuario",
            variant: "destructive",
          });
        }
      };
      updateUser();
    }
  };

  const isFormValid = personalInfo.name && personalInfo.email && passwords.new && passwords.confirm && passwordsMatch && role;

  const toggleShowPassword = (field: keyof typeof showPassword) => {
    setShowPassword(prevState => ({ ...prevState, [field]: !prevState[field] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Crear nuevo usuario</DialogTitle>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <div className="px-4 md:px-6 mt-6">
                <CardTitle className="mb-4">Datos básicos</CardTitle>
              </div>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                      <Input id="name" value={personalInfo.name} onChange={handlePersonalInfoChange} placeholder="Ingrese su nombre" className="bg-white dark:bg-gray-800 text-black dark:text-white" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surname">Apellido</Label>
                      <Input id="surname" value={personalInfo.surname} onChange={handlePersonalInfoChange} placeholder="Ingrese su apellido" className="bg-white dark:bg-gray-800 text-black dark:text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico <span className="text-red-500">*</span></Label>
                      <Input id="email" type="email" value={personalInfo.email} onChange={handlePersonalInfoChange} placeholder="correo@ejemplo.com" className="bg-white dark:bg-gray-800 text-black dark:text-white" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol <span className="text-red-500">*</span></Label>
                      <Select value={role} onValueChange={handleRoleChange} required>
                        <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrador">Administrador</SelectItem>
                          <SelectItem value="Veterinario">Veterinario</SelectItem>
                          <SelectItem value="Industria">Industria</SelectItem>
                          <SelectItem value="Ganadero">Ganadero</SelectItem>
                        </SelectContent>
                      </Select>
                      {roleError && <p className="text-red-500 text-sm font-bold">El rol es obligatorio.</p>}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <CardTitle className="mb-4">Datos de seguridad</CardTitle>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <Label htmlFor="new">Nueva contraseña <span className="text-red-500">*</span></Label>
                      <Input
                        id="new"
                        type={showPassword.new ? "text" : "password"}
                        value={passwords.new}
                        onChange={handlePasswordChange}
                        placeholder="Ingrese su nueva contraseña"
                        className={`bg-white dark:bg-gray-800 text-black dark:text-white ${!passwordsMatch ? 'border-red-500' : ''}`}
                        required
                      />
                      <button type="button" onClick={() => toggleShowPassword('new')} className="absolute right-2 top-8 mt-1 mr-1">
                        {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="confirm">Confirmar nueva contraseña <span className="text-red-500">*</span></Label>
                      <Input
                        id="confirm"
                        type={showPassword.confirm ? "text" : "password"}
                        value={passwords.confirm}
                        onChange={handlePasswordChange}
                        placeholder="Ingrese otra vez su nueva contraseña"
                        className={`bg-white dark:bg-gray-800 text-black dark:text-white ${!passwordsMatch ? 'border-red-500' : ''}`}
                        required
                      />
                      <button type="button" onClick={() => toggleShowPassword('confirm')} className="absolute right-2 top-8 mt-1 mr-1">
                        {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  { !passwordsMatch && (
                    <p className="text-red-500 text-sm font-bold">Las contraseñas no coinciden.</p>
                  ) }
                  {role !== 'Administrador' && (
                    <>
                    <Separator />
                    <div>
                      <CardTitle className="mb-4">Granjas asignadas</CardTitle>
                    </div>
                    <div className="space-y-2">
                      <DataTable<Farm>
                        columns={columnsAlternative}
                        data={farms}
                        enableColumnSelection={true}
                        rowSelection={selectedFarms}
                        onRowSelectionChange={handleSelectionChange}
                        onPageChange={handlePageChange}
                        onSearchChange={handleSearchChange}
                        currentPage={page}
                        totalPages={totalPages}
                        limit={10}
                        totalItems={totalItems} 
                        containerClassName="w-full border rounded-md shadow-sm max-w-[80vw]"

                      />
                    </div>
                  </>
                  )}
                  <Button id="submit-data-button" type="submit" disabled={!isFormValid}>Enviar datos</Button>
                </form>
              </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
  );
}

export default UserAddModal;


