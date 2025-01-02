'use client'

import { useSession } from "next-auth/react"
import PageContainer from '@/components/layout/page-container';
import { navItems } from '@/constants/data'
import { Settings } from 'lucide-react'
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/layout/aurora-background"

export default function Component() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'Usuario'
  
  // Only show name if it has 16 or fewer characters
  const displayName = session?.user?.name && session.user.name.length <= 16 ? session.user.name : ''

  const allowedNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <AuroraBackground>
    <PageContainer scrollable={true}>
        <div className="container mx-auto px-4 sm:px-6 pb-2 pt-6 sm:pt-12 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="space-y-6 mb-10 sm:space-y-12"
          >
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Hola {displayName} 
              </h1>
              <p className="mt-2 sm:mt-4 text-base sm:text-xl text-gray-600 dark:text-neutral-200 font-light">
                Tu espacio personal para gestionar la información de tus granjas
              </p>
            </div>
          
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/40 backdrop-blur-md dark:bg-black/20 text-gray-800 dark:text-white rounded-lg p-6 max-w-5xl mx-auto"
            >
              <p className="text-gray-600 dark:text-neutral-200 mb-4 justify-center text-center text-light">
                Selecciona una de las <span className="font-bold">opciones</span> para acceder a las distintas secciones de la web
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {allowedNavItems.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-md dark:bg-black/40 rounded-lg p-4 hover:bg-gray-50/90 dark:hover:bg-black/50 transition-all border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center mt-[-2px]">
                        <item.icon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                      </div>
                      <h3 className="font-bold mb-2 text-lg text-gray-900 dark:text-white">{item.name}</h3>
                    </div>
                    <p className="text-md text-gray-600 dark:text-neutral-200">{item.description}</p>
                  </motion.div>
                ))}
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-6 bg-white/80 backdrop-blur-md dark:bg-black/40 rounded-lg p-4 hover:bg-gray-50/90 dark:hover:bg-black/50 transition-all border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center mt-[-2px]">
                    <Settings className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                  </div>
                  <h3 className="font-bold mb-2 text-lg text-gray-900 dark:text-white">Ajustes de usuario</h3>
                </div>
                <p className="text-md text-gray-600 dark:text-neutral-200">
                  Haz clic en tu avatar en la esquina inferior izquierda para acceder a los ajustes de usuario
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </PageContainer>
    </AuroraBackground>
  )
}
