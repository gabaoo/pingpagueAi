import NotificationHistory from "@/components/NotificationHistory";

export default function Historic() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Histórico de Notificações</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Acompanhe todas as mensagens enviadas</p>
      </div>
      <NotificationHistory />
    </div>
  );
}
