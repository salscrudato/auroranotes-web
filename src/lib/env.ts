/**
 * Environment validation and configuration
 * Validates required environment variables at runtime
 */

interface EnvConfig {
  apiBase: string;
  apiKey: string | null;
  isDev: boolean;
  isProd: boolean;
}

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get environment configuration
 */
export function getEnvConfig(): EnvConfig {
  return {
    apiBase: (import.meta.env.VITE_API_BASE as string) || '',
    apiKey: (import.meta.env.VITE_API_KEY as string) || null,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  };
}

/**
 * Validate environment configuration
 */
export function validateEnv(): EnvValidationResult {
  const config = getEnvConfig();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: API base URL
  if (!config.apiBase) {
    errors.push(
      'VITE_API_BASE is not set. Add it to your .env.local file:\n' +
      'VITE_API_BASE=http://localhost:8787'
    );
  } else if (!isValidUrl(config.apiBase)) {
    errors.push(`VITE_API_BASE is not a valid URL: ${config.apiBase}`);
  }

  // Optional but recommended: API key
  if (!config.apiKey && config.isProd) {
    warnings.push('VITE_API_KEY is not set. API requests may fail if authentication is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Log environment validation results to console
 */
export function logEnvValidation(): void {
  const result = validateEnv();
  const config = getEnvConfig();

  if (config.isDev) {
    console.group('🔧 Environment Configuration');
    console.log('API Base:', config.apiBase || '(not set)');
    console.log('API Key:', config.apiKey ? '(set)' : '(not set)');
    console.log('Mode:', config.isDev ? 'development' : 'production');
    
    if (result.errors.length > 0) {
      console.error('❌ Errors:');
      result.errors.forEach(err => console.error('  -', err));
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:');
      result.warnings.forEach(warn => console.warn('  -', warn));
    }
    
    if (result.isValid && result.warnings.length === 0) {
      console.log('✅ All environment variables are valid');
    }
    
    console.groupEnd();
  }
}

/**
 * Assert environment is valid, throw if not
 */
export function assertEnvValid(): void {
  const result = validateEnv();
  
  if (!result.isValid) {
    throw new Error(
      'Environment configuration is invalid:\n' + 
      result.errors.join('\n')
    );
  }
}

