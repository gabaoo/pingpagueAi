import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CSVImportProps {
  onImportComplete: () => void;
}

export function CSVImport({ onImportComplete }: CSVImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string): Array<{ name: string; phone: string }> => {
    const lines = text.split('\n').filter(line => line.trim());
    const data: Array<{ name: string; phone: string }> = [];

    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(/[,;]/); // Support comma or semicolon
      
      if (values.length >= 2) {
        const name = values[0].trim().replace(/^["']|["']$/g, '');
        const phone = values[1].trim().replace(/^["']|["']$/g, '').replace(/\D/g, '');

        if (name && phone) {
          data.push({ name, phone });
        }
      }
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV");
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const clients = parseCSV(text);

      if (clients.length === 0) {
        toast.error("Nenhum cliente válido encontrado no arquivo");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Add user_id to each client
      const clientsWithUserId = clients.map(client => ({
        ...client,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from("clients")
        .insert(clientsWithUserId);

      if (error) throw error;

      toast.success(`${clients.length} cliente(s) importado(s) com sucesso!`);
      setOpen(false);
      setFile(null);
      onImportComplete();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Erro ao importar clientes: " + (error.message || "Tente novamente"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Clientes do CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com as colunas: Nome, Telefone
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Formato esperado: Nome, Telefone (uma linha por cliente)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Exemplo de formato:</Label>
            <pre className="text-xs bg-muted p-2 rounded">
              Nome, Telefone{'\n'}
              João Silva, 11999999999{'\n'}
              Maria Santos, 11988888888
            </pre>
          </div>

          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importando..." : "Importar Clientes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
