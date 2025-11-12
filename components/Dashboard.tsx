
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Badge from './ui/Badge';
import { mockCharges, mockClients } from '../lib/mockData';
import { Charge, ChargeStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { DollarSignIcon, ClockIcon, AlertTriangleIcon, UsersIcon } from './Icons';

const getStatusBadgeVariant = (status: ChargeStatus) => {
    switch (status) {
        case ChargeStatus.Paid: return 'success';
        case ChargeStatus.Pending: return 'secondary';
        case ChargeStatus.Overdue: return 'destructive';
        case ChargeStatus.Canceled: return 'outline';
        default: return 'default';
    }
};

const Dashboard: React.FC = () => {
    const summary = useMemo(() => {
        return mockCharges.reduce((acc, charge) => {
            if (charge.status === ChargeStatus.Paid) acc.received += charge.amount;
            if (charge.status === ChargeStatus.Pending) acc.pending += charge.amount;
            if (charge.status === ChargeStatus.Overdue) acc.overdue += charge.amount;
            return acc;
        }, { received: 0, pending: 0, overdue: 0 });
    }, []);

    const recentCharges = useMemo(() => {
        return [...mockCharges].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()).slice(0, 5);
    }, []);

    const last7DaysData = useMemo(() => {
        const data: { name: string; Recebido: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            const receivedOnDay = mockCharges
                .filter(c => c.status === ChargeStatus.Paid && c.paidAt && c.paidAt.toDateString() === date.toDateString())
                .reduce((sum, c) => sum + c.amount, 0);

            data.push({ name: dateString, Recebido: receivedOnDay });
        }
        return data;
    }, []);

    const pieChartData = [
        { name: 'Recebido', value: summary.received },
        { name: 'Pendente', value: summary.pending },
        { name: 'Em Atraso', value: summary.overdue },
    ];
    const PIE_COLORS = ['#10b981', '#64748b', '#ef4444'];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                        <DollarSignIcon className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.received)}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total de cobranças pagas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cobranças Pendentes</CardTitle>
                        <ClockIcon className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.pending)}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Aguardando pagamento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cobranças Atrasadas</CardTitle>
                        <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.overdue)}</div>
                         <p className="text-xs text-slate-500 dark:text-slate-400">Total de cobranças vencidas</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                        <UsersIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockClients.length}</div>
                         <p className="text-xs text-slate-500 dark:text-slate-400">Clientes cadastrados</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recebimentos (Últimos 7 dias)</CardTitle>
                        <CardDescription>Visão geral dos valores recebidos diariamente.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={last7DaysData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(240 3.7% 15.9% / 0.5)" />
                                <XAxis dataKey="name" stroke="hsl(240 3.7% 15.9%)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(240 3.7% 15.9%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                <Tooltip cursor={{ fill: 'hsl(240 3.7% 15.9% / 0.1)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}/>
                                <Bar dataKey="Recebido" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição de Valores</CardTitle>
                        <CardDescription>Balanço geral das suas cobranças.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name">
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cobranças Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentCharges.map((charge: Charge) => (
                                <TableRow key={charge.id}>
                                    <TableCell>{charge.clientName}</TableCell>
                                    <TableCell>{formatCurrency(charge.amount)}</TableCell>
                                    <TableCell>{formatDate(charge.dueDate)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(charge.status)}>
                                            {charge.status}
                                        </Badge>
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

export default Dashboard;
