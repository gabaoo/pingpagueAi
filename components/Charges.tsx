
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import { mockCharges } from '../lib/mockData';
import { Charge, ChargeStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

const getStatusBadgeVariant = (status: ChargeStatus) => {
    switch (status) {
        case ChargeStatus.Paid: return 'success';
        case ChargeStatus.Pending: return 'secondary';
        case ChargeStatus.Overdue: return 'destructive';
        case ChargeStatus.Canceled: return 'outline';
        default: return 'default';
    }
};

const Charges: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gerenciamento de Cobranças</CardTitle>
            <Button>Nova Cobrança</Button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Input placeholder="Buscar por cliente..." className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCharges.map((charge: Charge) => (
                <TableRow key={charge.id}>
                  <TableCell className="font-medium">{charge.clientName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(charge.amount)}</TableCell>
                  <TableCell>{formatDate(charge.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(charge.status)}>
                      {charge.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{charge.recurrence}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charges;
