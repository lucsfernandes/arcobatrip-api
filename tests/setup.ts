import 'reflect-metadata';

// Mock das variáveis de ambiente para testes
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.TYPEORM_USERNAME = 'test';
process.env.TYPEORM_PASSWORD = 'test';
process.env.TYPEORM_DATABASE = 'test';
