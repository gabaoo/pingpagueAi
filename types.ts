
export enum ChargeStatus {
  Pending = 'Pendente',
  Paid = 'Pago',
  Overdue = 'Vencido',
  Canceled = 'Cancelado',
}

export enum Recurrence {
  None = 'Nenhuma',
  Weekly = 'Semanal',
  Biweekly = 'Quinzenal',
  Monthly = 'Mensal',
  Quarterly = 'Trimestral',
  Annually = 'Anual',
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: Date;
}

export interface Charge {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: ChargeStatus;
  recurrence: Recurrence;
  notes?: string;
}

export enum NotificationType {
    Reminder = 'Lembrete',
    Overdue = 'Vencido',
    PaymentReceived = 'Pagamento Recebido',
}

export interface Notification {
  id: string;
  chargeId: string;
  clientName: string;
  type: NotificationType;
  sentAt: Date;
  status: 'Enviado' | 'Falhou';
}
