import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ITEMS_PER_PAGE = 20;

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [clientNameFilter, setClientNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('');
  const [notificationStatusFilter, setNotificationStatusFilter] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('notifications')
        .select(`
          id,
          message_content,
          sent_at,
          status,
          notification_type,
          clients (name)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      // Apply filters
      if (clientNameFilter) {
        query = query.ilike('clients.name', `%${clientNameFilter}%`);
      }
      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.gte('sent_at', startOfDay.toISOString()).lte('sent_at', endOfDay.toISOString());
      }
      if (notificationTypeFilter) {
        query = query.eq('notification_type', notificationTypeFilter);
      }
      if (notificationStatusFilter) {
        query = query.eq('status', notificationStatusFilter);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      // Filter out notifications where client name is null when client filter is active
      const filteredData = clientNameFilter 
        ? (data || []).filter(n => n.clients?.name)
        : (data || []);

      setNotifications(filteredData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, clientNameFilter, dateFilter, notificationTypeFilter, notificationStatusFilter]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFilterReset = () => {
    setClientNameFilter('');
    setDateFilter('');
    setNotificationTypeFilter('');
    setNotificationStatusFilter('');
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
          <Input
            placeholder="Filtrar por nome do cliente"
            value={clientNameFilter}
            onChange={(e) => {
              setClientNameFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full"
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full"
          />
          <Select
            value={notificationTypeFilter || "all"}
            onValueChange={(value) => {
              setNotificationTypeFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de notificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="reception">Recepção</SelectItem>
              <SelectItem value="reminder">Lembrete</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
              <SelectItem value="payment_confirmed">Confirmação</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={notificationStatusFilter || "all"}
            onValueChange={(value) => {
              setNotificationStatusFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleFilterReset} className="w-full sm:w-auto sm:col-span-2 lg:col-span-1">
            Limpar Filtros
          </Button>
        </div>
        {loading ? (
          <p className="text-center py-8">Carregando...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhuma notificação encontrada</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="min-w-full divide-y">
                <thead>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Mensagem</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Enviado em</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notifications.map((notification) => (
                    <tr key={notification.id}>
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                        <div className="max-w-[120px] sm:max-w-none truncate">
                          {notification.clients?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm max-w-md truncate hidden md:table-cell">
                        {notification.message_content}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm">
                        <div className="whitespace-nowrap text-xs sm:text-sm">
                          {new Date(notification.sent_at).toLocaleString('pt-BR', { 
                            dateStyle: 'short', 
                            timeStyle: 'short' 
                          })}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {notification.notification_type === 'reception' ? 'Recepção' :
                           notification.notification_type === 'reminder' ? 'Lembrete' :
                           notification.notification_type === 'overdue' ? 'Vencido' :
                           notification.notification_type === 'payment_confirmed' ? 'Confirmação' :
                           notification.notification_type}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <Badge variant={notification.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                          {notification.status === 'sent' ? 'Enviado' : 'Falhou'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
