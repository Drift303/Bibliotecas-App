import { useNavigate } from "react-router-dom"; 
 
export default function NotFound() { 
  const navigate = useNavigate(); 
  return ( 
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br 
from-slate-100 to-slate-300 dark:from-slate-950 dark:to-slate-900"> 
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-10 
rounded-3xl shadow-2xl border border-white/50 dark:border-slate-800/50 text-center 
max-w-md"> 
        <h1 className="text-6xl font-extrabold text-[#1E3A5F] dark:text-blue-400 mb
4">404</h1> 
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">Esta página no 
existe.</p> 
        <button 
          onClick={() => navigate("/")} 
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 
rounded-xl transition duration-300" 
        > 
          Volver al inicio 
        </button> 
      </div> 
    </div> 
  ); 
} 