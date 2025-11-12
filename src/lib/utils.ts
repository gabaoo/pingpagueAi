import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");
  
  // Converte para número e formata
  const amount = parseFloat(numbers) / 100;
  
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrency(value: string): number {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");
  return parseFloat(numbers) / 100;
}

export function formatPhoneNumber(value: string): string {
  // Remove tudo que não é número
  return value.replace(/\D/g, "");
}
