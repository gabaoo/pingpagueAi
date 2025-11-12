
import { Client, Charge, Notification, ChargeStatus, Recurrence, NotificationType } from '../types';

const today = new Date();
const subDays = (date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

// Mock Clients
export const mockClients: Client[] = [
  { id: 'cli_1', name: 'Ana Silva', phone: '(11) 98765-4321', email: 'ana.silva@example.com', createdAt: subDays(today, 30) },
  { id: 'cli_2', name: 'Bruno Costa', phone: '(21) 91234-5678', email: 'bruno.costa@example.com', createdAt: subDays(today, 45) },
  { id: 'cli_3', name: 'Carla Dias', phone: '(31) 95555-8888', email: 'carla.dias@example.com', createdAt: subDays(today, 15) },
  { id: 'cli_4', name: 'Daniel Alves', phone: '(41) 94444-7777', email: 'daniel.alves@example.com', createdAt: subDays(today, 60) },
  { id: 'cli_5', name: 'Eduarda Lima', phone: '(51) 93333-6666', email: 'eduarda.lima@example.com', createdAt: subDays(today, 5) },
];

// Mock Charges
export const mockCharges: Charge[] = [
  { id: 'ch_1', clientId: 'cli_1', clientName: 'Ana Silva', amount: 150.00, dueDate: addDays(today, 5), status: ChargeStatus.Pending, recurrence: Recurrence.Monthly, notes: 'Consulta de rotina' },
  { id: 'ch_2', clientId: 'cli_2', clientName: 'Bruno Costa', amount: 300.50, dueDate: subDays(today, 2), status: ChargeStatus.Paid, paidAt: subDays(today, 1), recurrence: Recurrence.None, notes: 'Projeto Freelance' },
  { id: 'ch_3', clientId: 'cli_3', clientName: 'Carla Dias', amount: 80.00, dueDate: subDays(today, 7), status: ChargeStatus.Overdue, recurrence: Recurrence.Weekly, notes: 'Aula particular' },
  { id: 'ch_4', clientId: 'cli_4', clientName: 'Daniel Alves', amount: 500.00, dueDate: addDays(today, 15), status: ChargeStatus.Pending, recurrence: Recurrence.Quarterly, notes: 'Manutenção de sistema' },
  { id: 'ch_5', clientId: 'cli_5', clientName: 'Eduarda Lima', amount: 220.00, dueDate: addDays(today, 1), status: ChargeStatus.Pending, recurrence: Recurrence.None },
  { id: 'ch_6', clientId: 'cli_1', clientName: 'Ana Silva', amount: 150.00, dueDate: subDays(today, 25), status: ChargeStatus.Paid, paidAt: subDays(today, 25), recurrence: Recurrence.Monthly },
  { id: 'ch_7', clientId: 'cli_2', clientName: 'Bruno Costa', amount: 450.00, dueDate: subDays(today, 10), status: ChargeStatus.Overdue, recurrence: Recurrence.None, notes: 'Design de logo' },
  { id: 'ch_8', clientId: 'cli_3', clientName: 'Carla Dias', amount: 80.00, dueDate: subDays(today, 14), status: ChargeStatus.Paid, paidAt: subDays(today, 14), recurrence: Recurrence.Weekly },
  { id: 'ch_9', clientId: 'cli_5', clientName: 'Eduarda Lima', amount: 180.00, dueDate: subDays(today, 3), status: ChargeStatus.Canceled, recurrence: Recurrence.None, notes: 'Cancelado pelo cliente' },
  { id: 'ch_10', clientId: 'cli_1', clientName: 'Ana Silva', amount: 75.50, dueDate: addDays(today, 8), status: ChargeStatus.Pending, recurrence: Recurrence.None },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  { id: 'not_1', chargeId: 'ch_1', clientName: 'Ana Silva', type: NotificationType.Reminder, sentAt: subDays(today, 2), status: 'Enviado' },
  { id: 'not_2', chargeId: 'ch_3', clientName: 'Carla Dias', type: NotificationType.Overdue, sentAt: subDays(today, 6), status: 'Enviado' },
  { id: 'not_3', chargeId: 'ch_2', clientName: 'Bruno Costa', type: NotificationType.PaymentReceived, sentAt: subDays(today, 1), status: 'Enviado' },
  { id: 'not_4', chargeId: 'ch_7', clientName: 'Bruno Costa', type: NotificationType.Overdue, sentAt: subDays(today, 9), status: 'Enviado' },
  { id: 'not_5', chargeId: 'ch_5', clientName: 'Eduarda Lima', type: NotificationType.Reminder, sentAt: subDays(today, 1), status: 'Falhou' },
];
