'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, User, Lock, Eye, EyeOff, Check, X, AlertTriangle, Palette } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUserContext';
import { notifyProfileUpdate, getUserLocalData } from '@/services/user-service';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';


export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const { user } = useUser();
  const { setTheme, theme } = useTheme();
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
  const [primaryColor, setPrimaryColor] = useState({ hue: 240, saturation: 100, lightness: 50 });
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


  const colorPresets = [
    { name: "Azul", hue: 240, saturation: 100, lightness: 50 },
    { name: "Cielo", hue: 199, saturation: 100, lightness: 70 },
    { name: "Púrpura", hue: 253, saturation: 91, lightness: 58 },
    { name: "Pino", hue: 160, saturation: 65, lightness: 35 },
    { name: "Verde", hue: 141, saturation: 60, lightness: 50 },
    { name: "Lima", hue: 90, saturation: 90, lightness: 40 },
    { name: "Rojo", hue: 0, saturation: 100, lightness: 60 },
    { name: "Fucsia", hue: 340, saturation: 100, lightness: 60 },
    { name: "Naranja", hue: 16, saturation: 100, lightness: 65 },
    { name: "Ámbar", hue: 39, saturation: 100, lightness: 50 },
    { name: "Oro", hue: 45, saturation: 90, lightness: 55 }, 
    { name: "Plata", hue: 210, saturation: 10, lightness: 70 },
    { name: "Gris", hue: 210, saturation: 2, lightness: 58 },
    { name: "Café", hue: 30, saturation: 50, lightness: 30 },  ];

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
        setActiveTab("apariencia");
      }
      
      // Cargar configuración de color actual
      const root = document.documentElement;
      const cssVarValue = getComputedStyle(root).getPropertyValue('--primary').trim();
      // Intenta extraer valores HSL de la variable CSS
      const hslMatch = cssVarValue.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
      if (hslMatch) {
        setPrimaryColor({
          hue: parseInt(hslMatch[1], 10),
          saturation: parseInt(hslMatch[2], 10),
          lightness: parseInt(hslMatch[3], 10)
        });
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
  
  const handleColorPresetChange = (preset: typeof colorPresets[0]) => {
    setPrimaryColor(preset);
    applyThemeColor(preset);
  };
  
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = { ...primaryColor, hue: parseInt(e.target.value, 10) };
    setPrimaryColor(newColor);
    applyThemeColor(newColor);
  };
  
  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = { ...primaryColor, saturation: parseInt(e.target.value, 10) };
    setPrimaryColor(newColor);
    applyThemeColor(newColor);
  };
  
  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = { ...primaryColor, lightness: parseInt(e.target.value, 10) };
    setPrimaryColor(newColor);
    applyThemeColor(newColor);
  };
  
  const applyThemeColor = (color: { hue: number, saturation: number, lightness: number }) => {
    const { hue, saturation, lightness } = color;
    const hslValue = `${hue} ${saturation}% ${lightness}%`;
    
    // Aplicar el cambio a variables CSS en modo claro
    document.documentElement.style.setProperty('--primary', hslValue);
    document.documentElement.style.setProperty('--ring', hslValue);
    
    // Guardar preferencia en localStorage
    localStorage.setItem('theme-primary-color', JSON.stringify(color));
    
    // Ajustes adicionales para elementos relacionados
    // Foreground más claro para el texto sobre el color primario
    document.documentElement.style.setProperty('--primary-foreground', `${hue} ${saturation}% 98%`);
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
            <div className="md:w-1/4 md:min-w-[200px] md:max-w-[200px] border-b md:border-b-0 md:border-r border-border bg-muted/30 relative">
              <ScrollArea className="h-full absolute inset-0 z-10">
                <div className="p-2 md:p-4">
                    <div className="pt-6 mb-4 hidden md:block">
                    </div>
                  <TabsList className="flex flex-row md:flex-col w-full bg-transparent space-y-0 space-x-1 md:space-x-0 md:space-y-2 p-1 md:p-2">
                    {[
                      { value: "apariencia", label: "Apariencia", icon: Palette },
                      { value: "cuenta", label: "Cuenta", icon: User },
                      { value: "seguridad", label: "Seguridad", icon: Lock },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex-1 md:w-full h-9 justify-center md:justify-start items-center px-3 py-1.5 text-sm font-medium rounded-md border border-input hover:bg-primary hover:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-primary dark:data-[state=active]:border-2 transition-colors bg-white dark:bg-gray-800 dark:text-white"
                        onClick={() => setActiveTab(tab.value)}
                      >
                        <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 w-full">
                          <tab.icon className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="hidden md:block truncate">{tab.label}</span>
                        </div>
                        <ChevronRight className="hidden md:ml-auto h-4 w-4 opacity-50 flex-shrink-0" />
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
                <TabsContent value="apariencia" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferencia de tema</CardTitle>
                      <CardDescription>Selecciona el modo de visualización de la aplicación</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 'light', label: 'Claro', image: '/img/ui-light.png' },
                          { value: 'dark', label: 'Oscuro', image: '/img/ui-dark.png' },
                          { value: 'system', label: 'Sistema', image: '/img/ui-system.png' },
                        ].map((option) => (
                          <div key={option.value} className="flex flex-col items-center">
                            <button
                              onClick={() => {
                                setTheme(option.value);
                                // Guardar la preferencia de tema en localStorage para que persista después de cerrar sesión
                                localStorage.setItem('user-theme-preference', option.value);
                              }}
                              className={`w-full p-1 rounded-xl border-2 transition-all ${
                                theme === option.value
                                  ? 'border-primary bg-accent/50'
                                  : 'border-border hover:border-primary/50 hover:bg-accent/20'
                              }`}
                              aria-label={`Seleccionar tema ${option.label}`}
                            >
                              <div className="aspect-video w-full overflow-hidden rounded-lg bg-background">
                                <img 
                                  src={option.image} 
                                  alt={`Vista previa del tema ${option.label}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </button>
                            <span className="mt-2 text-sm font-medium">{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Personalización del tema</CardTitle>
                      <CardDescription>Ajusta el color principal de la interfaz</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium mb-3">Color personalizado</h3>
                        <div className="space-y-6">
                          {/* Interactive color picker */}
                          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 shadow-inner border border-border">
                            {/* Color field - saturation/lightness field */}
                            <div 
                              className="absolute inset-0 cursor-crosshair"
                              style={{ 
                                backgroundColor: `hsl(${primaryColor.hue}, 100%, 50%)`,
                                backgroundImage: `
                                  linear-gradient(to right, white, transparent),
                                  linear-gradient(to top, black, transparent)
                                `
                              }}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                                const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                                
                                const saturation = Math.round(x);
                                const lightness = Math.round(100 - y);
                                
                                const newColor = { 
                                  ...primaryColor, 
                                  saturation, 
                                  lightness: Math.min(lightness, 95) // Limitar brillo máximo a 95% para evitar blanco puro
                                };
                                
                                setPrimaryColor(newColor);
                                applyThemeColor(newColor);
                              }}
                            >
                              {/* Selector point */}
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-white shadow-md absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ 
                                  left: `${primaryColor.saturation}%`, 
                                  top: `${100 - primaryColor.lightness}%`,
                                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Hue slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="hue">Tono ({primaryColor.hue}°)</Label>
                            </div>
                            
                            <div className="relative h-8 rounded-md overflow-hidden border border-border">
                              {/* Colored bar */}
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(to right, 
                                    hsl(0, 100%, 50%), 
                                    hsl(60, 100%, 50%), 
                                    hsl(120, 100%, 50%), 
                                    hsl(180, 100%, 50%), 
                                    hsl(240, 100%, 50%), 
                                    hsl(300, 100%, 50%), 
                                    hsl(360, 100%, 50%))`
                                }}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
                                  
                                  const newColor = { ...primaryColor, hue: Math.round(x) };
                                  setPrimaryColor(newColor);
                                  applyThemeColor(newColor);
                                }}
                              />
                              
                              {/* Slider handle */}
                              <div 
                                className="absolute top-0 bottom-0 w-1 bg-white border border-gray-400 rounded-sm shadow-md -ml-[2px]"
                                style={{ left: `${(primaryColor.hue / 360) * 100}%` }}
                              />
                              
                              {/* Hidden input for accessibility */}
                              <Input
                                id="hue"
                                type="range"
                                min="0"
                                max="360"
                                step="1"
                                value={primaryColor.hue}
                                onChange={handleHueChange}
                                className="opacity-0 absolute inset-0 cursor-pointer z-10"
                                aria-label="Ajustar tono de color"
                              />
                            </div>
                          </div>
                          
                          {/* HSL values with text inputs */}
                          <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="space-y-2">
                              <Label htmlFor="hue-input" className="text-xs">Tono (H)</Label>
                              <div className="flex">
                                <Input
                                  id="hue-input"
                                  type="number"
                                  min="0"
                                  max="360"
                                  value={primaryColor.hue}
                                  onChange={(e) => {
                                    const hue = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                    const newColor = { ...primaryColor, hue };
                                    setPrimaryColor(newColor);
                                    applyThemeColor(newColor);
                                  }}
                                  className="text-sm bg-white dark:bg-gray-800 text-black dark:text-white"
                                />
                                <span className="ml-1 flex items-center text-sm text-muted-foreground">°</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="saturation-input" className="text-xs">Saturación (S)</Label>
                              <div className="flex">
                                <Input
                                  id="saturation-input"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={primaryColor.saturation}
                                  onChange={(e) => {
                                    const saturation = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                    const newColor = { ...primaryColor, saturation };
                                    setPrimaryColor(newColor);
                                    applyThemeColor(newColor);
                                  }}
                                  className="text-sm bg-white dark:bg-gray-800 text-black dark:text-white"
                                />
                                <span className="ml-1 flex items-center text-sm text-muted-foreground">%</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="lightness-input" className="text-xs">Luminosidad (L)</Label>
                              <div className="flex">
                                <Input
                                  id="lightness-input"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={primaryColor.lightness}
                                  onChange={(e) => {
                                    const lightness = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                    const newColor = { ...primaryColor, lightness };
                                    setPrimaryColor(newColor);
                                    applyThemeColor(newColor);
                                  }}
                                  className="text-sm bg-white dark:bg-gray-800 text-black dark:text-white"
                                />
                                <span className="ml-1 flex items-center text-sm text-muted-foreground">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Colores predefinidos</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-7 gap-2">
                          {colorPresets.map((preset) => (
                            <button
                              key={preset.name}
                              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all ${
                                primaryColor.hue === preset.hue && 
                                primaryColor.saturation === preset.saturation && 
                                primaryColor.lightness === preset.lightness
                                  ? 'ring-2 ring-primary bg-accent'
                                  : 'hover:bg-accent'
                              }`}
                              onClick={() => handleColorPresetChange(preset)}
                              aria-label={`Seleccionar color ${preset.name}`}
                            >
                              <div 
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: `hsl(${preset.hue}, ${preset.saturation}%, ${preset.lightness}%)` }}
                              />
                              <span className="text-xs truncate w-full text-center">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
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
