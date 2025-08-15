import React from 'react';
import SupabaseExample from './components/SupabaseExample';
import './App.css';

// Este é um exemplo de como integrar o Supabase no App principal
// Para usar, renomeie este arquivo para App.js (fazendo backup do atual)

function App() {
  return (
    <div className="App">
      <SupabaseExample />
    </div>
  );
}

export default App;

// ============================================
// INSTRUÇÕES PARA INTEGRAÇÃO COMPLETA
// ============================================

/*

1. BACKUP DO APP ATUAL:
   - Renomeie o App.js atual para App.mongodb.js
   - Renomeie este arquivo (App.supabase.js) para App.js

2. CONFIGURAÇÃO DE AMBIENTE:
   - Certifique-se de que as variáveis do Supabase estão no .env:
     REACT_APP_SUPABASE_URL=sua_url_aqui
     REACT_APP_SUPABASE_ANON_KEY=sua_chave_aqui

3. INSTALAÇÃO DE DEPENDÊNCIAS:
   npm install @supabase/supabase-js

4. ESTRUTURA DE PASTAS RECOMENDADA:
   src/
   ├── components/
   │   ├── Auth/
   │   │   ├── LoginForm.jsx
   │   │   ├── RegisterForm.jsx
   │   │   └── ProtectedRoute.jsx
   │   ├── Songs/
   │   │   ├── SongList.jsx
   │   │   ├── SongForm.jsx
   │   │   └── SongCard.jsx
   │   ├── Schedules/
   │   │   ├── ScheduleList.jsx
   │   │   ├── ScheduleForm.jsx
   │   │   └── ScheduleCard.jsx
   │   └── SupabaseExample.jsx
   ├── hooks/
   │   └── useSupabase.js
   ├── config/
   │   └── supabase.js
   └── App.js

5. EXEMPLO DE INTEGRAÇÃO GRADUAL:

   import React, { useState } from 'react';
   import { useAuth } from './hooks/useSupabase';
   
   // Componentes MongoDB (existentes)
   import MongoDBApp from './App.mongodb';
   
   // Componentes Supabase (novos)
   import SupabaseExample from './components/SupabaseExample';
   
   function App() {
     const [useSupabase, setUseSupabase] = useState(false);
     const { user } = useAuth();
   
     return (
       <div className="App">
         <div className="database-toggle">
           <button 
             onClick={() => setUseSupabase(false)}
             className={!useSupabase ? 'active' : ''}
           >
             MongoDB (Atual)
           </button>
           <button 
             onClick={() => setUseSupabase(true)}
             className={useSupabase ? 'active' : ''}
           >
             Supabase (Novo)
           </button>
         </div>
         
         {useSupabase ? (
           <SupabaseExample />
         ) : (
           <MongoDBApp />
         )}
       </div>
     );
   }
   
   export default App;

6. COMPONENTES ESPECÍFICOS:

   // LoginForm.jsx
   import React, { useState } from 'react';
   import { useAuth } from '../hooks/useSupabase';
   
   const LoginForm = () => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const { signIn } = useAuth();
   
     const handleSubmit = async (e) => {
       e.preventDefault();
       const { error } = await signIn(email, password);
       if (error) alert(error.message);
     };
   
     return (
       <form onSubmit={handleSubmit}>
         <input 
           type="email" 
           value={email} 
           onChange={(e) => setEmail(e.target.value)}
           placeholder="Email"
           required 
         />
         <input 
           type="password" 
           value={password} 
           onChange={(e) => setPassword(e.target.value)}
           placeholder="Senha"
           required 
         />
         <button type="submit">Entrar</button>
       </form>
     );
   };
   
   export default LoginForm;

7. ROTEAMENTO COM REACT ROUTER:

   npm install react-router-dom
   
   import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
   import { useAuth } from './hooks/useSupabase';
   import LoginForm from './components/Auth/LoginForm';
   import Dashboard from './components/Dashboard';
   
   function App() {
     const { user, loading } = useAuth();
   
     if (loading) return <div>Carregando...</div>;
   
     return (
       <Router>
         <Routes>
           <Route path="/login" element={<LoginForm />} />
           <Route path="/" element={
             user ? <Dashboard /> : <Navigate to="/login" />
           } />
         </Routes>
       </Router>
     );
   }

8. CONTEXT PROVIDER (OPCIONAL):

   // contexts/AuthContext.js
   import React, { createContext, useContext } from 'react';
   import { useAuth } from '../hooks/useSupabase';
   
   const AuthContext = createContext();
   
   export const AuthProvider = ({ children }) => {
     const auth = useAuth();
     return (
       <AuthContext.Provider value={auth}>
         {children}
       </AuthContext.Provider>
     );
   };
   
   export const useAuthContext = () => {
     const context = useContext(AuthContext);
     if (!context) {
       throw new Error('useAuthContext must be used within AuthProvider');
     }
     return context;
   };
   
   // No index.js ou App.js
   import { AuthProvider } from './contexts/AuthContext';
   
   <AuthProvider>
     <App />
   </AuthProvider>

9. ESTILIZAÇÃO COM TAILWIND (OPCIONAL):

   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   
   // tailwind.config.js
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   
   // src/index.css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

10. DEPLOY:
    - As variáveis de ambiente já estão configuradas no render.yaml
    - Certifique-se de configurar as variáveis no dashboard do Render
    - O build automático incluirá os novos arquivos

*/