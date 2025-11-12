// ============================================
// MELHORIA 2: Validação de Input Robusta
// ============================================
// Biblioteca de validação reutilizável para Edge Functions

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export class InputValidator {
  static validateRequired(
    value: any,
    fieldName: string
  ): string | null {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} é obrigatório`;
    }
    return null;
  }

  static validateUUID(
    value: string,
    fieldName: string
  ): string | null {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return `${fieldName} deve ser um UUID válido`;
    }
    return null;
  }

  static validatePhone(
    value: string,
    fieldName: string
  ): string | null {
    const cleanPhone = value.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return `${fieldName} deve ter 10 ou 11 dígitos`;
    }
    return null;
  }

  static validateAmount(
    value: number,
    fieldName: string
  ): string | null {
    if (typeof value !== 'number' || value <= 0) {
      return `${fieldName} deve ser um número positivo`;
    }
    if (value > 999999.99) {
      return `${fieldName} excede o valor máximo permitido`;
    }
    return null;
  }

  static validateDate(
    value: string,
    fieldName: string
  ): string | null {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} deve ser uma data válida`;
    }
    return null;
  }

  static validateEnum<T extends string>(
    value: string,
    allowedValues: T[],
    fieldName: string
  ): string | null {
    if (!allowedValues.includes(value as T)) {
      return `${fieldName} deve ser um dos valores: ${allowedValues.join(', ')}`;
    }
    return null;
  }

  static sanitizeString(value: string, maxLength = 1000): string {
    return value
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Remove basic XSS attempts
  }

  static validateAll(
    validations: Array<string | null>
  ): ValidationResult<void> {
    const errors = validations.filter((v): v is string => v !== null);
    
    if (errors.length > 0) {
      return {
        success: false,
        errors: { validation: errors.join('; ') }
      };
    }
    
    return { success: true };
  }
}

// Validação específica para geração PIX
export interface PixChargeInput {
  client_name: string;
  client_phone: string;
  valor: number;
  vencimento: string;
}

export function validatePixChargeInput(
  input: any
): ValidationResult<PixChargeInput> {
  const errors: Record<string, string> = {};

  // Validar client_name
  if (!input.client_name || typeof input.client_name !== 'string') {
    errors.client_name = 'Nome do cliente é obrigatório';
  } else if (input.client_name.length < 3) {
    errors.client_name = 'Nome deve ter pelo menos 3 caracteres';
  } else if (input.client_name.length > 100) {
    errors.client_name = 'Nome deve ter no máximo 100 caracteres';
  }

  // Validar client_phone
  const phoneError = InputValidator.validatePhone(
    input.client_phone,
    'Telefone do cliente'
  );
  if (phoneError) errors.client_phone = phoneError;

  // Validar valor
  const amountError = InputValidator.validateAmount(
    input.valor,
    'Valor'
  );
  if (amountError) errors.valor = amountError;

  // Validar vencimento
  const dateError = InputValidator.validateDate(
    input.vencimento,
    'Data de vencimento'
  );
  if (dateError) {
    errors.vencimento = dateError;
  } else {
    const vencimentoDate = new Date(input.vencimento);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (vencimentoDate < today) {
      errors.vencimento = 'Data de vencimento não pode ser no passado';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      client_name: InputValidator.sanitizeString(input.client_name, 100),
      client_phone: input.client_phone.replace(/\D/g, ''),
      valor: input.valor,
      vencimento: input.vencimento
    }
  };
}
