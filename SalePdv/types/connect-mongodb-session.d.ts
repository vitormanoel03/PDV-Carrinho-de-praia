declare module 'connect-mongodb-session' {
  import session from 'express-session';
  
  interface MongoDBSessionOptions {
    uri: string;
    databaseName?: string;
    collection?: string;
    connectionOptions?: Record<string, any>;
    expires?: number;
    idField?: string;
    createAutoRemoveIdx?: boolean;
    autoRemove?: string;
    autoRemoveInterval?: number;
  }
  
  function ConnectMongoDBSession(
    session: typeof import('express-session')
  ): new (options: MongoDBSessionOptions) => session.Store;
  
  export = ConnectMongoDBSession;
}