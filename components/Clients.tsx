
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import { mockClients, mockCharges } from '../lib/mockData';
import { Client, ChargeStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

const Clients: React.FC = () => {
    
  const getClientStats = (clientId: string) => {
    const clientCharges = mockCharges.filter(c => c.clientId === clientId);
    const totalBilled = clientCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = clientCharges.filter(c => c.status === ChargeStatus.Paid).reduce((sum, c) => sum + c.amount, 0);
    const overdueCount = clientCharges.filter(c => c.status === ChargeStatus.Overdue).length;
    return { totalBilled, totalPaid, overdueCount };
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gerenciamento de Clientes</CardTitle>
            <Button>Novo Cliente</Button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Input placeholder="Buscar por nome ou email..." className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Total Cobrado</TableHead>
                <TableHead>Total Pago</TableHead>
                <TableHead>Atrasos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClients.map((client: Client) => {
                const stats = getClientStats(client.id);
                return (
                    <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                            <div>{client.phone}</div>
                            <div className="text-xs text-slate-500">{client.email}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(stats.totalBilled)}</TableCell>
                        <TableCell className="text-emerald-500">{formatCurrency(stats.totalPaid)}</TableCell>
                        <TableCell className={stats.overdueCount > 0 ? 'text-red-500' : ''}>{stats.overdueCount}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                            Ver Histórico
                        </Button>
                        </TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
