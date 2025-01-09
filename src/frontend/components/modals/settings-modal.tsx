'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, User, Lock, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUserContext';
import { notifyProfileUpdate, getUserLocalData } from '@/services/user-service';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('');
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    surname: '',
    email: ''
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { toast } = useToast();

  // Cargar datos del usuario cuando se abre el modal, priorizando localStorage
  useEffect(() => {
    if (isOpen) {
      // Primero intentar obtener datos del localStorage
      const localData = getUserLocalData();
      
      if (localData && localData.name && localData.email) {
        // Si hay datos en localStorage, usar esos
        setPersonalInfo({
          name: localData.name || '',
          surname: localData.surname || '',
          email: localData.email || ''
        });
      } else if (user) {
        // Si no hay datos en localStorage, usar los de context
        setPersonalInfo({
          name: user.name || '',
          surname: user.surname || '',
          email: user.email || ''
        });
      } else if (session?.user) {
        // Última opción: usar datos de la sesión
        setPersonalInfo({
          name: session.user.name || '',
          surname: session.user.surname || '',
          email: session.user.email || ''
        });
      }
      
      // Establecer la pestaña activa por defecto
      if (!activeTab) {
        setActiveTab("cuenta");
      }
    }
  }, [isOpen, user, session, activeTab]);

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const updated = { ...passwords, [id]: value };
    setPasswords(updated);
    setPasswordsMatch(updated.new === updated.confirm);
  };

  const toggleShowPassword = (field: keyof typeof showPassword) => {
    setShowPassword(prevState => ({ ...prevState, [field]: !prevState[field] }));
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalInfo.name || !personalInfo.email) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('http://localhost:5001/user/update-basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session?.accessToken}`,
        },
        body: JSON.stringify(personalInfo),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar los datos básicos');
      }
      
      // Utilizar nuestra función de notificación para actualizar los datos en toda la aplicación
      notifyProfileUpdate({
        name: personalInfo.name,
        surname: personalInfo.surname,
        email: personalInfo.email,
        token: data.token
      });
      
      toast({
        description: "Datos básicos actualizados con éxito",
        variant: "success",
      });

      onClose();
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar los datos básicos",
        variant: "destructive",
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    if (!passwordsMatch) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('http://localhost:5001/user/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session?.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la contraseña');
      }
      
      toast({
        description: "Contraseña actualizada con éxito",
        variant: "success",
      });
      
      // Resetear los campos de contraseña
      setPasswords({
        current: '',
        new: '',
        confirm: ''
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la contraseña",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onClose();
    
    // Reset state when modal is closed
    setActiveTab('');
    setPasswords({
      current: '',
      new: '',
      confirm: ''
    });
    setPasswordsMatch(true);
    setShowPassword({
      current: false,
      new: false,
      confirm: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg">
            <DialogTitle className="text-lg font-bold">Configuración</DialogTitle>
          </div>
          <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-border bg-muted/30 md:overflow-y-auto md:pt-1 relative">
              <ScrollArea className="h-full absolute inset-0 z-10">
                <div className="p-2 md:pt-4">
                  <TabsList className="flex flex-row md:flex-col items-stretch w-full bg-transparent space-y-0 space-x-1 md:space-x-0 md:space-y-2 p-1 md:p-2 md:pt-10">
                    {[
                      { value: "cuenta", label: "Cuenta", icon: User },
                      { value: "seguridad", label: "Seguridad", icon: Lock },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex-1 md:flex-initial justify-center md:justify-between items-center px-3 py-4 md:py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-md transition-colors"
                        onClick={() => setActiveTab(tab.value)}
                      >
                        <div className="flex items-center gap-2 md:gap-3 justify-center md:justify-start">
                          <tab.icon className="h-4 w-4" />
                          <span className="hidden md:inline">{tab.label}</span>
                        </div>
                        <ChevronRight className="hidden md:block h-4 w-4 opacity-50" />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </ScrollArea>
            </div>
            <ScrollArea className="flex-grow">
              <div className="p-4 md:p-6">
                <TabsContent value="cuenta" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Datos personales</CardTitle>
                      <CardDescription>Actualice su información de perfil</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
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
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Correo electrónico <span className="text-red-500">*</span>
                          </Label>
                          <Input id="email" type="email" value={personalInfo.email} onChange={handlePersonalInfoChange} required placeholder="correo@ejemplo.com" className="bg-white dark:bg-gray-800 text-black dark:text-white" />
                        </div>
                        <Button type="submit">Guardar cambios</Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="seguridad" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cambiar contraseña</CardTitle>
                      <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2 relative">
                          <Label htmlFor="current">
                            Contraseña actual <span className="text-red-500">*</span>
                          </Label>
                          <Input id="current" type={showPassword.current ? "text" : "password"} value={passwords.current} onChange={handlePasswordChange} required placeholder="Ingrese su contraseña actual" className="bg-white dark:bg-gray-800 text-black dark:text-white" />
                          <button type="button" onClick={() => toggleShowPassword('current')} className="absolute right-2 top-8 mt-1 mr-1">
                            {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 relative">
                            <Label htmlFor="new">
                              Nueva contraseña <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="new"
                              type={showPassword.new ? "text" : "password"}
                              value={passwords.new}
                              onChange={handlePasswordChange}
                              required
                              placeholder="Ingrese su nueva contraseña"
                              className={`bg-white dark:bg-gray-800 text-black dark:text-white ${!passwordsMatch ? 'border-red-500' : ''}`}
                            />
                            <button type="button" onClick={() => toggleShowPassword('new')} className="absolute right-2 top-8 mt-1 mr-1">
                              {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="space-y-2 relative">
                            <Label htmlFor="confirm">
                              Confirmar nueva contraseña <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="confirm"
                              type={showPassword.confirm ? "text" : "password"}
                              value={passwords.confirm}
                              onChange={handlePasswordChange}
                              required
                              placeholder="Repita su nueva contraseña"
                              className={`bg-white dark:bg-gray-800 text-black dark:text-white ${!passwordsMatch ? 'border-red-500' : ''}`}
                            />
                            <button type="button" onClick={() => toggleShowPassword('confirm')} className="absolute right-2 top-8 mt-1 mr-1">
                              {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        { !passwordsMatch && (
                          <p className="text-red-500 text-sm font-bold">Las contraseñas no coinciden.</p>
                        ) }
                        <Button type="submit">Cambiar contraseña</Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
