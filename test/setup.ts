/**
 * Global test setup.
 * Sets environment variables for all tests.
 */
process.env.JWT_SECRET = 'test-jwt-secret-32-bytes-minimum!!';
process.env.REGISTRATION_TOKEN = 'test-registration-token';
process.env.DATABASE_URL = 'postgres://dum360:dum360@localhost:5432/dum360_test';
process.env.NODE_ENV = 'test';
