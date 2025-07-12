/**
 * Modal para crear nuevos usuarios en el sistema
 * Permite configurar datos personales, contraseñas, roles y asignación de granjas
 * Incluye validaciones de seguridad y gestión de permisos
 * Proporciona una interfaz completa para la gestión de usuarios del sistema
 */

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';

/**
 * Componente modal para crear nuevos usuarios
 * Gestiona la creación completa de usuarios con validaciones y asignación de recursos
 * Implementa control de acceso basado en roles y gestión de granjas
 */
const UserAddModal: React.FC<{ isOpen: boolean; onClose: () => void; onRefresh: () => void }> = ({ isOpen, onClose, onRefresh }) => {
  const { data: session } = useSession();
  
  // Estados para información personal del usuario
  // Almacena los datos básicos del usuario a crear
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    surname: '',
    email: ''
  });
  
  // Estados para gestión de contraseñas
  // Maneja la creación de contraseñas con validaciones de seguridad
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  
  // Estados para gestión de roles y granjas
  // Controla la asignación de roles y granjas al usuario
  const [role, setRole] = useState('');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarms, setSelectedFarms] = useState<Record<string, boolean>>({});
  const [roleError, setRoleError] = useState(false);
  
  // Estados para paginación y búsqueda de granjas
  // Controla la paginación y filtrado de la lista de granjas disponibles
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Referencias para evitar actualizaciones conflictivas
  // Previene condiciones de carrera en las peticiones asíncronas
  const isFetchingRef = useRef(false);
  const lastRequestedPageRef = useRef(1);

  const { toast } = useToast();

  /**
   * Controlador de cambio de página separado para evitar actualizaciones conflictivas
   * Mantiene un registro de la última página solicitada para evitar condiciones de carrera
   * @param newPage - Nueva página a cargar
   */
  const handlePageChange = useCallback((newPage: number) => {
    lastRequestedPageRef.current = newPage;
    setPage(newPage);
  }, []);

  /**
   * Controlador de cambio de búsqueda separado
   * Resetea la paginación cuando cambia el término de búsqueda
   * @param term - Término de búsqueda
   */
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    lastRequestedPageRef.current = 1;
    setPage(1);
  }, []);

  /**
   * Obtiene la lista de granjas disponibles para asignación
   * Implementa paginación y búsqueda para optimizar el rendimiento
   * Previene peticiones duplicadas con control de estado
   */
  const fetchFarms = useCallback(async () => {
    if (!session?.accessToken || isFetchingRef.current) {
      console.error('No hay sesión iniciada o ya se está realizando una petición');
      return;
    }

    const currentPage = lastRequestedPageRef.current;
    isFetchingRef.current = true;
  
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/farm/list?page=${currentPage}&limit=10&searchTerm=${searchTerm}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
          cache: 'no-store'
        }
      );
      if (!response.ok) {
        throw new Error('Error al obtener granjas');
      }
      const result = await response.json();
      
      // Verificamos que no haya habido un cambio de página posterior a esta solicitud
      if (currentPage === lastRequestedPageRef.current) {
        setFarms(result.data);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Error al obtener granjas:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [session, searchTerm]);

  /**
   * Efecto para cargar granjas cuando se abre el modal
   * Se ejecuta cuando el modal se abre o cambia la página
   */
  useEffect(() => {
    if (isOpen) {
      fetchFarms();
    }
  }, [isOpen, fetchFarms, page]);

  /**
   * Maneja cambios en la información personal del usuario
   * Actualiza el estado local con los nuevos valores del input
   * @param e - Evento de cambio del input
   */
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.id]: e.target.value });
  };

  /**
   * Verifica la fortaleza de la contraseña según criterios de seguridad
   * Implementa validaciones estándar de seguridad para contraseñas
   * @param pass - Contraseña a verificar
   * @returns Array con los criterios cumplidos
   */
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

  /**
   * Criterios de fortaleza de la contraseña actual
   * Se recalcula automáticamente cuando cambia la contraseña
   */
  const strength = useMemo(() => 
    checkStrength(passwords.new), 
    [passwords.new]
  );

  /**
   * Puntuación de fortaleza de la contraseña (0-4)
   * Cuenta cuántos criterios de seguridad se cumplen
   */
  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  /**
   * Obtiene el color CSS para la barra de fortaleza
   * Proporciona feedback visual sobre la seguridad de la contraseña
   * @param score - Puntuación de fortaleza
   * @returns Clase CSS del color
   */
  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score === 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  /**
   * Obtiene el texto descriptivo de la fortaleza
   * Proporciona feedback textual sobre la seguridad de la contraseña
   * @param score - Puntuación de fortaleza
   * @returns Texto descriptivo
   */
  const getStrengthText = (score: number) => {
    if (score === 0) return "Ingrese una contraseña";
    if (score <= 2) return "Contraseña débil";
    if (score === 3) return "Contraseña media";
    return "Contraseña fuerte";
  };

  /**
   * Verifica si la contraseña es válida para el envío
   * Valida que todos los campos estén completos y las contraseñas coincidan
   */
  const isPasswordValid = useMemo(() => {
    return passwords.new.length > 0 && 
           passwords.confirm.length > 0 && 
           passwordsMatch && 
           strengthScore == 4;
  }, [passwords, passwordsMatch, strengthScore]);

  /**
   * Maneja cambios en los campos de contraseña
   * Actualiza el estado local y verifica que las contraseñas coincidan
   * @param e - Evento de cambio del input
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const updated = { ...passwords, [id]: value };
    setPasswords(updated);
    setPasswordsMatch(updated.new === updated.confirm);
  };

  /**
   * Maneja el cambio de rol del usuario
   * Actualiza el rol y limpia selecciones de granjas si es necesario
   * @param value - Nuevo rol seleccionado
   */
  const handleRoleChange = (value: string) => {
    setRole(value);
    setRoleError(false);
    if (value === 'Administrador') setSelectedFarms({});
  };

  /**
   * Maneja cambios en la selección de granjas
   * Actualiza el estado de granjas seleccionadas
   * @param selectedRowIds - IDs de las granjas seleccionadas
   */
  const handleSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    setSelectedFarms(selectedRowIds);
  };

  /**
   * Resetea el formulario a sus valores iniciales
   * Limpia todos los campos y restaura valores por defecto
   */
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
    lastRequestedPageRef.current = 1;
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
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
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

  const isFormValid = personalInfo.name && personalInfo.email && isPasswordValid && role;

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
                          Nueva contraseña <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="new"
                            type={showPassword.new ? "text" : "password"}
                            value={passwords.new}
                            onChange={handlePasswordChange}
                            required
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
                          Confirmar nueva contraseña <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm"
                            type={showPassword.confirm ? "text" : "password"}
                            value={passwords.confirm}
                            onChange={handlePasswordChange}
                            required
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


