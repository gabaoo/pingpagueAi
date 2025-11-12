
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Input from './ui/Input';
import Badge from './ui/Badge';
import Select from './ui/Select';
import { mockNotifications } from '../lib/mockData';
import { Notification, NotificationType } from '../types';
import { formatDate } from '../lib/utils';

const getStatusBadgeVariant = (status: 'Enviado' | 'Falhou') => {
    return status === 'Enviado' ? 'success' : 'destructive';
};

const getTypeBadgeVariant = (type: NotificationType) => {
    switch (type) {
        case NotificationType.Reminder: return 'secondary';
        case NotificationType.Overdue: return 'warning';
        case NotificationType.PaymentReceived: return 'default';
        default: return 'outline';
    }
};

const Notifications: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>Histórico de Notificações</CardTitle>
            <div className="mt-4 flex items-center gap-4">
                <Input placeholder="Buscar por cliente..." className="max-w-sm" />
                <Select>
                    <option value="">Todos os Tipos</option>
                    <option value={NotificationType.Reminder}>Lembrete</option>
                    <option value={NotificationType.Overdue}>Vencido</option>
                    <option value={NotificationType.PaymentReceived}>Pagamento Recebido</option>
                </Select>
                 <Select>
                    <option value="">Todos os Status</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Falhou">Falhou</option>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ID da Cobrança</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockNotifications.map((notification: Notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">{notification.clientName}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(notification.type)}>
                        {notification.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(notification.sentAt, { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(notification.status)}>
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{notification.chargeId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
