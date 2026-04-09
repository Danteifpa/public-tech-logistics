import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Mail, User, GraduationCap, Target } from 'lucide-react';

const About = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Sobre o Sistema</h1>
        <p className="text-slate-500">Modernização da Gestão de Chamados TechDept AdminDept</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="h-2 bg-blue-600 w-full" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5 text-blue-600" />
            Desenvolvedor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nome Completo</label>
                <p className="text-lg font-semibold text-slate-800">Dante Dias Monteiro</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg mt-1">
                  <Monitor className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargo Atual</label>
                  <p className="text-slate-700 font-medium">Técnico de TI (TechDept-CORI)</p>
                  <p className="text-xs text-slate-500">Prefeitura de Metropolitan - AdminDept</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg mt-1">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Formação Acadêmica</label>
                  <p className="text-slate-700 font-medium">Bacharel em Ciência e Tecnologia</p>
                  <p className="text-xs text-slate-500">Instituto Federal do Pará (IFPA)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg mt-1">
                  <Mail className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Contato Oficial</label>
                  <p className="text-slate-700 font-medium">dantemonteiroedm@gmail.com</p>
                  <a 
                    href="mailto:dantemonteiroedm@gmail.com" 
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Enviar e-mail agora
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg mt-1">
                  <Target className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Objetivo do Projeto</label>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Modernização e otimização do fluxo de atendimento técnico da Secretaria Municipal de Administração de Metropolitan, 
                    proporcionando maior agilidade, transparência e controle estatístico dos serviços prestados pela TechDept.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center pt-4">
        <p className="text-xs text-slate-400 font-medium">
          © 2026 Dante Dias Monteiro | TechDept - AdminDept Metropolitan
        </p>
      </div>
    </div>
  );
};

export default About;