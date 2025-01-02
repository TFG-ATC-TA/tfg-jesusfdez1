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

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es obligatorio' })
    .email({ message: 'Introduce una dirección de correo electrónico válida' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria' })
});

type UserFormValues = z.infer<typeof formSchema>;

export default function Component() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  // Set isMounted to true once component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ocurrió un error al enviar los datos al servidor. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Use a simple placeholder during server-side rendering to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="w-full max-w-md mx-auto space-y-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="font-medium">Correo electrónico</div>
            <div className="h-10 bg-white dark:bg-gray-800 rounded-md border"></div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Contraseña</div>
            <div className="h-10 bg-white dark:bg-gray-800 rounded-md border"></div>
          </div>
          <button className="w-full h-10 bg-primary/90 rounded-md text-white font-medium">
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      setError(null);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Introduce tu contraseña"
                      disabled={loading}
                      className="bg-white dark:bg-gray-800 text-black dark:text-white"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setError(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 mt-1 mr-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button disabled={loading} className="w-full" type="submit">
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </Form>
    </div>
  );
}