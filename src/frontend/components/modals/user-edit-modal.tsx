'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Farm, User } from '@/types';
import { useSession } from 'next-auth/react';
import { DataTable } from '@/components/ui/data-table';
import { columnsAlternative } from '@/components/tables/farm-tables/columns';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';

const UserEditModal: React.FC<{ isOpen: boolean; onClose: () => void; userId: string; onRefresh: () => void }> = ({ isOpen, onClose, userId, onRefresh }) => {
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
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });

  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Password strength check logic
  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: "Al menos 8 caracteres" },
      { regex: /[0-9]/, text: "Al menos 1 número" },
      { regex: /[a-z]/, text: "Al menos 1 letra minúscula" },
      { regex: /[A-Z]/, text: "Al menos 1 letra mayúscula" },
    ];

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }));
  };

  const strength = useMemo(() => 
    checkStrength(passwords.new), 
    [passwords.new]
  );

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score === 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Ingrese una contraseña";
    if (score <= 2) return "Contraseña débil";
    if (score === 3) return "Contraseña media";
    return "Contraseña fuerte";
  };

  const isPasswordValid = useMemo(() => {
    // If empty, it means we're not changing the password, which is valid
    if (passwords.new === '' && passwords.confirm === '') return true;
    // Otherwise, needs to match and have enough strength
    return passwords.new === passwords.confirm && strengthScore >= 3;
  }, [passwords, passwordsMatch, strengthScore]);

  const fetchUserData = async () => {
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
      const response = await fetch(`http://localhost:5001/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener datos del usuario');
      
      const fetchedUser: User = await response.json();
      setPersonalInfo({
        name: fetchedUser.name,
        surname: fetchedUser.surname,
        email: fetchedUser.email
      });
      setRole(fetchedUser.role);
      const initialSelectedFarms: Record<string, boolean> = {};
      fetchedUser.farms.forEach(farmId => {
        initialSelectedFarms[farmId] = true;
      });
      setSelectedFarms(initialSelectedFarms);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      toast({
        title: "Error",
        description: "No se han podido obtener los datos del usuario",
        variant: "destructive",
      });
      onClose(); // Close the modal since we can't load the data
    }
  };

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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener granjas');
      }
      const result = await response.json();
      setFarms(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener granjas:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al obtener las granjas",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
      fetchFarms();
    }
  }, [isOpen, session, userId, page, searchTerm]);

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
    if (value === 'Administrador') setSelectedFarms({});
  };

  const handleSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    setSelectedFarms(selectedRowIds);
  };

  const toggleShowPassword = (field: keyof typeof showPassword) => {
    setShowPassword(prevState => ({ ...prevState, [field]: !prevState[field] }));
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
    setSelectedFarms({});
    setShowPassword({
      new: false,
      confirm: false
    });
    setPage(1);
    setSearchTerm('');
    setLoading(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = (e as React.FormEvent<HTMLFormElement> & { nativeEvent: SubmitEvent }).nativeEvent.submitter as HTMLButtonElement;
    if (target && target.id === 'save-changes-button') {
      if (!isPasswordValid) {
        toast({
          title: "Error",
          description: "Por favor verifique que las contraseñas coincidan y cumplan con los requisitos de seguridad",
          variant: "destructive",
        });
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
          const response = await fetch(`http://localhost:5001/user/${userId}`, {
            method: 'PUT',
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
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar el usuario');
          }
          console.log('Usuario actualizado con éxito');
          toast({
            description: "Usuario actualizado con éxito",
            variant: "success",
          });
          onClose();
          onRefresh();
        } catch (error) {
          console.error('Error al actualizar el usuario:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al actualizar el usuario",
            variant: "destructive",
          });
        }
      };
      updateUser();
    }
  };

  if (loading) {
    return null; // No renderizar nada mientras se cargan los datos
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Configuración del usuario seleccionado</DialogTitle>
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
                      <Label htmlFor="name">
                        Nombre <span className="text-red-500">*</span>
                      </Label>
                      <Input id="name" value={personalInfo.name} onChange={handlePersonalInfoChange} required placeholder="Ingrese su nombre" className="bg-white dark:bg-gray-800 text-black dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surname">Apellido</Label>
                      <Input id="surname" value={personalInfo.surname} onChange={handlePersonalInfoChange} placeholder="Ingrese su apellido" className="bg-white dark:bg-gray-800 text-black dark:text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Correo electrónico <span className="text-red-500">*</span>
                      </Label>
                      <Input id="email" type="email" value={personalInfo.email} onChange={handlePersonalInfoChange} required placeholder="correo@ejemplo.com" className="bg-white dark:bg-gray-800 text-black dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">
                        Rol <span className="text-red-500">*</span>
                      </Label>
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
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <CardTitle className="mb-4">Datos de seguridad</CardTitle>
                    <p className="text-sm text-gray-500 mb-4">Si no se introduce una nueva contraseña, la actual permanecerá sin cambios</p>
                  </div>
                  {passwords.new && passwords.confirm && !passwordsMatch && (
                    <div className="mb-4 px-4 py-3 rounded-md bg-destructive dark:bg-red-900 border border-destructive dark:border-red-800 text-white flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 inline-block flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm font-medium">Las contraseñas no coinciden</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-2 md:col-span-6">
                      <div className="space-y-2">
                        <Label htmlFor="new">
                          Nueva contraseña 
                        </Label>
                        <div className="relative">
                          <Input
                            id="new"
                            type={showPassword.new ? "text" : "password"}
                            value={passwords.new}
                            onChange={handlePasswordChange}
                            placeholder="Ingrese su nueva contraseña"
                            className={`bg-white dark:bg-gray-800 text-black dark:text-white pe-9 ${!passwordsMatch && passwords.new && passwords.confirm ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            aria-invalid={strengthScore < 4}
                          />
                          <button 
                            type="button" 
                            onClick={() => toggleShowPassword('new')} 
                            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
                            aria-label={showPassword.new ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm">
                          Confirmar nueva contraseña 
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm"
                            type={showPassword.confirm ? "text" : "password"}
                            value={passwords.confirm}
                            onChange={handlePasswordChange}
                            placeholder="Repita su nueva contraseña"
                            className={`bg-white dark:bg-gray-800 text-black dark:text-white pe-9 ${!passwordsMatch && passwords.new && passwords.confirm ? 'border-destructive ring-1 ring-destructive' : ''}`}
                          />
                          <button 
                            type="button" 
                            onClick={() => toggleShowPassword('confirm')} 
                            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
                            aria-label={showPassword.confirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-6 md:pl-4 md:pt-2 flex flex-col justify-start">
                      <div
                        className="h-1 w-full overflow-hidden rounded-full bg-border mt-2"
                        role="progressbar"
                        aria-valuenow={strengthScore}
                        aria-valuemin={0}
                        aria-valuemax={4}
                        aria-label="Fuerza de la contraseña"
                      >
                        <div
                          className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
                          style={{ width: `${(strengthScore / 4) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-medium mt-4">
                        {getStrengthText(strengthScore)}. Debe contener:
                      </p>
                      <ul className="space-y-1.5 mt-3" aria-label="Requisitos de contraseña">
                        {strength.map((req, index) => (
                          <li key={index} className="flex items-center gap-2">
                            {req.met ? (
                              <Check size={16} className="text-emerald-500" aria-hidden="true" />
                            ) : (
                              <X size={16} className="text-muted-foreground/80" aria-hidden="true" />
                            )}
                            <span className={`text-xs ${req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                              {req.text}
                              <span className="sr-only">
                                {req.met ? " - Requisito cumplido" : " - Requisito no cumplido"}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
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
                  <Button id="save-changes-button" type="submit">Guardar cambios</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default UserEditModal;

