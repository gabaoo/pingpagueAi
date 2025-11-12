
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';

const Profile: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
          <CardDescription>Gerencie suas informações pessoais e de contato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nome Completo</label>
              <Input id="name" defaultValue="Usuário de Teste" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input id="email" type="email" defaultValue="usuario@pingpague.com" />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">Telefone</label>
            <Input id="phone" defaultValue="(99) 99999-9999" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button>Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Bancárias</CardTitle>
          <CardDescription>Estes dados serão usados para identificar pagamentos e incluir em mensagens.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bank" className="block text-sm font-medium mb-1">Banco</label>
              <Input id="bank" defaultValue="Banco Inter" />
            </div>
            <div>
              <label htmlFor="agency" className="block text-sm font-medium mb-1">Agência</label>
              <Input id="agency" defaultValue="0001" />
            </div>
             <div>
              <label htmlFor="account" className="block text-sm font-medium mb-1">Conta Corrente</label>
              <Input id="account" defaultValue="1234567-8" />
            </div>
          </div>
           <div>
              <label htmlFor="pix" className="block text-sm font-medium mb-1">Chave PIX (Telefone)</label>
              <Input id="pix" defaultValue="(99) 99999-9999" />
               <p className="text-xs text-slate-500 mt-1">Esta chave PIX será incluída nas mensagens de cobrança.</p>
            </div>
          <div className="pt-4 flex justify-end">
            <Button>Salvar Informações Bancárias</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
