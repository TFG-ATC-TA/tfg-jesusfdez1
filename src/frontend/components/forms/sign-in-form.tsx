/**
 * Formulario de inicio de sesión
 * Maneja la autenticación de usuarios con validación y manejo de errores
 * Integra con NextAuth para gestión de sesiones y proporciona UX optimizada
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Esquema de validación para el formulario de login
 * Define las reglas de validación para email y contraseña
 * Utiliza Zod para validación en tiempo real y mensajes de error personalizados
 */
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es obligatorio' })
    .email({ message: 'Introduce una dirección de correo electrónico válida' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria' })
});

/**
 * Tipo inferido del esquema de validación
 * Define la estructura de datos del formulario
 * Garantiza type safety en toda la aplicación
 */
type UserFormValues = z.infer<typeof formSchema>;

/**
 * Componente principal del formulario de inicio de sesión
 * Maneja la autenticación con next-auth y validación de formularios
 * Proporciona feedback visual y manejo de errores robusto
 */
export default function Component() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  /**
   * Marcar el componente como montado para evitar errores de hidratación
   * Garantiza que los componentes del lado del cliente se rendericen correctamente
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  /**
   * Configuración del formulario con react-hook-form y validación zod
   * Proporciona validación en tiempo real y manejo de estado optimizado
   */
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Función que maneja el envío del formulario de login
   * Integra con NextAuth para autenticación y maneja errores de forma segura
   * @param data - Datos del formulario validados
   */
  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    setError(null);
    
    // Limpiar localStorage al iniciar sesión para evitar conflictos con datos antiguos
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lactokeeper-user-data');
    }
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError(result.error); // Mostrar el mensaje de error enviado por el servidor
      } else if (result?.ok) {
        // Retrasamos la redirección para asegurarnos de que la sesión se haya cargado completamente
        setTimeout(() => {
          router.push('/');
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ocurrió un error al enviar los datos al servidor. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo de email con validación en tiempo real */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Introduce tu correo electrónico"
                    className="bg-white dark:bg-gray-800 text-black dark:text-white"
                    disabled={loading}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setError(null); // Limpiar errores al escribir
                    }}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          {/* Campo de contraseña con toggle de visibilidad */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={isMounted && showPassword ? "text" : "password"}
                      placeholder="Introduce tu contraseña"
                      disabled={loading}
                      className="bg-white dark:bg-gray-800 text-black dark:text-white"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setError(null); // Limpiar errores al escribir
                      }}
                    />
                    {/* Botón de toggle para mostrar/ocultar contraseña */}
                    {isMounted && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2 mt-1 mr-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          {/* Mensaje de error del servidor */}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {/* Botón de envío con estado de carga */}
          <Button disabled={loading} className="w-full" type="submit">
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
