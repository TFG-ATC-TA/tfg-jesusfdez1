'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, User, Lock, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
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

  const isPasswordChangeEnabled = useMemo(() => {
    return passwords.current.length > 0 && 
           passwords.new.length > 0 && 
           passwords.confirm.length > 0 && 
           passwordsMatch && 
           strengthScore >= 3;
  }, [passwords, passwordsMatch, strengthScore]);

  const isPersonalInfoChangeEnabled = useMemo(() => {
    return personalInfo.name.length > 0 && personalInfo.email.length > 0;
  }, [personalInfo]);

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

  const resetForm = () => {
    setPersonalInfo({
      name: '',
      surname: '',
      email: ''
    });
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
    setActiveTab('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
                        <Button 
                          type="submit" 
                          disabled={!isPersonalInfoChangeEnabled}
                          className={!isPersonalInfoChangeEnabled ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          Guardar cambios
                        </Button>
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
                          <div className="relative">
                            <Input 
                              id="current" 
                              type={showPassword.current ? "text" : "password"} 
                              value={passwords.current} 
                              onChange={handlePasswordChange} 
                              required 
                              placeholder="Ingrese su contraseña actual" 
                              className="bg-white dark:bg-gray-800 text-black dark:text-white pe-9" 
                            />
                            <button 
                              type="button" 
                              onClick={() => toggleShowPassword('current')} 
                              className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
                              aria-label={showPassword.current ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                              {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <Separator className="my-4" />
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
                        <Button 
                          type="submit" 
                          disabled={!isPasswordChangeEnabled}
                          className={!isPasswordChangeEnabled ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          Cambiar contraseña
                        </Button>
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
